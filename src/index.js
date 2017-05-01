const Adapter = require('./adapters/general.adapter');
const MySQLAdapter = require('./adapters/mysql.adapter');
const GeneratedHelper = require('./helpers/mysql-generated.helper');
const SessionHelper = require('./helpers/session.helper');
const Promise = require('bluebird');
const TemplateHelper = require('./helpers/template.helper');

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

    if (!adapter instanceof Adapter) {
      throw new Error('Unsupported Adapter');
    }

    this.adapter = adapter;
    this.sessionManager = new SessionHelper(this.adapter);
  };

  /**
   * @function Fabricator.startSession
   * @description Starts session. If session is started all modified or created data will be removed and restored at the end of current sessions. <br/> You can create more than one session and nest it in.
   */

  startSession () {
    this.sessionManager.startSession();
  };

  /**
   * @function Fabricator.stopSession
   * @description Stops last created session. Restores all the data that was created or updated during this session.
   * @returns {BlueBirdPromise} - will be resolved when data is restored
   */

  stopSession () {
    return this.sessionManager.stopSession();
  };

  /**
   * @function Fabricator.create
   * @description Creates record in database with data. Stores id of created entity in local session if session is started.
   * @param {string} table - table to query against
   * @param {*} data - data to instert
   */

  create (table, data) {
    return this.adapter.create(table, data).then((insertedData) => {
      this.sessionManager.saveSessionData(table, insertedData);
      return insertedData[0];
    });
  };

  /**
   * @function Fabricator.remove
   * @description Removes all entities from table that matched passed ID list
   * @param {string} table - table to query against
   * @param {number[]|object|string} filter - filter to find rows to delete
   */

  remove (table, filter, hasGenerated = false) {
    return this.adapter.select(table, '', filter, hasGenerated).then(data => {
      if (!data[0].length) {
        return true;
      }

      const generatedColumns = data[1];
      const dataToStoreInSession = GeneratedHelper.createDataToStoreInSession(data[0], generatedColumns);

      this.sessionManager.saveSessionData(table, dataToStoreInSession);

      return this.adapter.remove(table, filter);
    });
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

        this.sessionManager.saveSessionData(table, update);
        updateQueue.push(this.adapter.update(table, updateData, idList));
      }

      return BBPromise.all(updateQueue);
    });
  };

  select (table, fields, filter) {
    if (!filter) {
      filter = fields;
      fields = '';
    }
    return this.adapter.select(table, fields, filter).then(data => data[0]);
  }

  /**
   * @function Fabricator.closeConnection
   * @description Closes all currently active sessions and closes connection do database
   */

  closeConnection () {
    return this.sessionManager.stopAllSessions().then(() => {
      this.adapter.disconnect();
    });
  }

  createTemplate (table, data) {
    return new TemplateHelper(table, data, this.create.bind(this));
  }
};

module.exports.Fabricator = Fabricator;
module.exports.MySQLAdapter = MySQLAdapter;