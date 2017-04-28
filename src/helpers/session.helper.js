const uuid = require('uuid').v4;

/**
 * @class SessionHelper
 */
class SessionHelper {
  constructor (adapter) {
    this.sessionStared = false;
    this.sessionData = {};
    this.sessions = [];

    this.adapter = adapter;
  };

  /**
   * @function SessionHelper.startSession
   * @description Starts new session. Sets flag sessionStarted to false and inserts new uuid into session list
   */

  startSession () {
    this.sessionStared = true;
    this.sessions.unshift(uuid());
  };

  /**
   * @function SessionHelper.stopSession
   * @description Stops last started session. Restores all affected session data and removes session.
   * @returns {Promise} - will be resolved when data is deleted
   */

  stopSession () {
    const latestSessionKey = this.getLatestSessionKey();

    return this.removeSessionData(latestSessionKey).then(() => {
      this.removeSession(latestSessionKey);

      return true;
    });
  };


  /**
   * @function SessionHelper.getLatestSessionKey
   * @description Returns uuid of latest session
   * @returns {string} - uuid of latest session
   */

  getLatestSessionKey () {
    return this.sessions[0];
  };

  /**
   * @function SessionHelper.saveSessionData
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
   * @function SessionHelper.removeSessionData
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
   * @function SessionHelper.renderSessionData
   * @description Renders data saved in session. If data[n] is a number, delete this by id. If data[n] is an object, we should restore all values from data[n] by data[n].id
   * @param {string} table - table to perform queries to
   * @param {object[]|number[]} values - data that was saved for current session
   * @param {Promise[]} promiseQueue - promise queue to execute
   */

  renderSessionData (table, values, promiseQueue) {
    if (!values.length) {
      return;
    }
    const toDelete = [];
    const toUpdate = [];

    // if element of the value is simple number, that means we need to delete it.
    // if element of the value is an object, we need to modify it by id

    for (const element of values) {
      if (typeof element === 'number' || typeof element === 'string') {
        toDelete.push(element);
        continue;
      }

      // console.log(element);

      toUpdate.push(element);
    }

    for (const element of toUpdate) {
      if (element.__insert) {
        delete element.__insert;

        promiseQueue.push(this.adapter.create(table, element));
      } else if (toDelete.indexOf(element.id) === -1) {
        const elementId = element.id; // save id
        delete element.id; // we don't want to update id for the element

        promiseQueue.push(this.adapter.update(table, element, elementId));
      }
    }

    for (const element of toDelete) {
      promiseQueue.push(this.adapter.remove(table, element));
    }

    return promiseQueue;
  };

  /**
   * @function SessionHelper.removeSession
   * @description Removes session from local session key value storage. 
   * @param {string} sessionKey 
   */

  removeSession (sessionKey) {
    this.sessions.splice(this.sessions.indexOf(sessionKey), 1);
    delete this.sessionData[sessionKey];

    if (!this.sessions.length) {
      this.sessionStared = false;
    }
  };

  /**
   * @function SessionHelper.stopAllSessions
   * @description Stops all session one by one starting from the latest one.
   * @returns {Promise} - Will be resolved when all sessions are stopped
   */

  stopAllSessions () {
    if (!this.sessions.length) {
      return Promise.resolve(true);
    }

    return this.stopSession().then(this.stopAllSessions.bind(this));
  };
};

module.exports = SessionHelper;
