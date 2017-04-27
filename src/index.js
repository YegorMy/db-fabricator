const Adapter = require('./adapters/general.adapter');
const MySQLAdapter = require('./adapters/mysql.adapter');
const Promise = require('bluebird');
const uuid = require('uuid').v4;

/**
 * @class Fabricator
 * @description Main Class to fabricate the data in databases
 */

class Fabricator {
  /**
   * @constructor
   * @description Gets and adapter and sets up it as property of the class. 
   * @param {Adapter} adapter - Adapter to connect the database
   */
  constructor (adapter) {
    this.adapter = null;
    this.sessionStared = false;
    this.sessionData = {};
    this.sessions = [];

    if (!adapter instanceof Adapter) {
      throw new Error('Unsupported Adapter');
    }

    this.adapter = adapter;
  };

  /**
   * @function Fabricator.startSession
   * @description Starts session. If session is started all modified or created data will be removed and restored at the end of current sessions. <br/> You can create more than one session and nest it in.
   */

  startSession () {
    this.sessionStared = true;
    this.sessions.unshift(uuid());
  };

  /**
   * @function Fabricator.stopSession
   * @description Stops last created session. Restores all the data that was created or updated during this session.
   * @returns {Promise} - will be resolved when data is restored
   */

  stopSession () {
    const latestSessionKey = this.getLatestSessionKey();

    return this.removeSessionData(latestSessionKey).then(() => {
      this.removeSession(latestSessionKey);

      return true;
    });
  };
  
  /**
   * @function Fabricator.getLatestSessionKey
   * @description Returns uuid of latest session
   * @returns {string} - uuid of latest session
   */

  getLatestSessionKey () {
    return this.sessions[0];
  }

  /**
   * @function Fabricator.saveSessionData
   * @description Saves data to the latest session. This data will be removed or updated when current session will be closed. Contains only data from updates and creates.
   * @param {string} table - Table where we modify data
   * @param {number[]|number|object|object[]} insertedData - data that was created or updated
   */

  saveSessionData (table, insertedData) {
    const latestSessionKey = this.getLatestSessionKey();
    
    if (!this.sessionStared) {
      return false;
    }

    if (!this.sessionData[latestSessionKey]) {
      this.sessionData[latestSessionKey] = {};
    }

    if (!this.sessionData[latestSessionKey][table]) {
      this.sessionData[latestSessionKey][table] = [];
    }

    if (insertedData instanceof Array) {
      if (insertedData.length === 1) {
        this.sessionData[latestSessionKey][table].push(insertedData[0]);
      } else {
        for (const data of insertedData) {
          this.sessionData[latestSessionKey][table].push(data);
        }
      }
    } else {
      this.sessionData[latestSessionKey][table].push(insertedData);
    }
  };

  /**
   * @function Fabricator.removeSessionData
   * @description Removes data from session by it's key. Removes all created data and reverting all the modified data.
   * @param {string} sessionKey - Key of the session to remove data from
   */

  removeSessionData (sessionKey) {
    const promiseQueue = [];
    const sessionData = this.sessionData[sessionKey];
    if (!sessionData) {
      return Promise.resolve(true);
    }
    const sessionDataKeys = Object.keys(sessionData);

    for (const key of sessionDataKeys) {
      this.renderSessionData(key, sessionData[key], promiseQueue);
    }

    return Promise.all(promiseQueue);
  };

  /**
   * @function Fabricator.renderSessionData
   * @description Renders data saved in session. If data[n] is a number, delete this by id. If data[n] is an object, we should restore all values from data[n] by data[n].id
   * @param {string} table - table to perform queries to
   * @param {object[]|number[]} value - data that was aved for current session
   * @param {Promise[]} promiseQueue - promise queue to execute
   */

  renderSessionData (table, value, promiseQueue) {
    if (!value.length) {
      return;
    }
    const toDelete = [];
    const toUpdate = [];

    // if element of the value is simple number, that means we need to delete it.
    // if element of the value is an object, we need to modify it by id

    for (const element of value) {
      if (typeof element === 'number' || typeof element === 'string') {
        toDelete.push(element);
        continue;
      }

      toUpdate.push(element);
    }

    for (const element of toUpdate) {
      if (toDelete.indexOf(element.id) === -1) {
        const elementId = element.id; // save id
        delete element.id; // we don't want to update id for the element

        promiseQueue.push(this.adapter.update(table, element, elementId));
      }
    }

    for (const element of toDelete) {
      promiseQueue.push(this.adapter.remove(table, element));
    }

    return promiseQueue;
  }

  /**
   * @function Fabricator.removeSession
   * @description Removes session from local session key value storage. 
   * @param {string} sessionKey 
   */

  removeSession (sessionKey) {
    this.sessions.splice(this.sessions.indexOf(sessionKey), 1);
    delete this.sessionData[sessionKey];

    if (!this.sessions.length) {
      this.sessionStared = false;
    }
  }

  /**
   * @function Fabricator.create
   * @description Creates record in database with data. Stores id of created entity in local session if session is started.
   * @param {string} table - table to query against
   * @param {*} data - data to instert
   */

  create (table, data) {
    return this.adapter.create(table, data).then((insertedData) => {
      this.saveSessionData(table, insertedData);
      return true;
    });
  };

  /**
   * @function Fabricator.remove
   * @description Removes all entities from table that matched passed ID list
   * @param {string} table - table to query against
   * @param {number[]} data - array of ids to remove from table
   */

  remove (table, data) {
    return this.adapter.remove(table, data).then(() => true);
  };

  /**
   * @function Fabricator.update
   * @description Updates all entities that passed constraints in the database. Stroes initial state of each found entity.
   * @param {string} table - table to query against
   * @param {object} data - data to update
   * @param {object|string} constraints - constraints for query. It can be loopback-like filter or simple string with SQL query
   */

  update (table, updateData, constraints) {
    const promiseQueue = [];
    const fields = Object.keys(updateData);

    if (fields.indexOf('id') === -1) {
      fields.unshift('id');
    }

    return this.adapter.select(table, fields, constraints).then(data => {
      const initialData = data[0];
      const updateQueue = [];
      const idList = initialData.map(e => e.id);

      for (const update of initialData) {

        this.saveSessionData(table, update);
        updateQueue.push(this.adapter.update(table, updateData, idList));
      }

      return Promise.all(updateQueue);
    });
  };

  /**
   * @function Fabricator.closeConnection
   * @description Closes connection to current database
   */

  closeConnection () {
    this.adapter.disconnect();
  }
};

module.exports.Fabricator = Fabricator;
module.exports.MySQLAdapter = MySQLAdapter;