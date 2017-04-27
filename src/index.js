const Adapter = require('./adapters/general.adapter');
const MySQLAdapter = require('./adapters/mysql.adapter');
const Promise = require('bluebird');
const uuid = require('uuid').v4;

class Fabricator {
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

  startSession () {
    this.sessionStared = true;
    this.sessions.unshift(uuid());
  };

  stopSession () {
    const latestSessionKey = this.getLatestSessionKey();

    return this.removeSessionData(latestSessionKey).then(() => {
      this.removeSession(latestSessionKey);

      return true;
    });
  };

  getLatestSessionKey () {
    return this.sessions[0];
  }

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

  removeSessionData (sessionKey) {
    const promiseQueue = [];
    const sessionData = this.sessionData[sessionKey];
    const sessionDataKeys = Object.keys(sessionData);

    for (const key of sessionDataKeys) {
      this.renderSessionData(key, sessionData[key], promiseQueue);
    }

    return Promise.all(promiseQueue);
  };

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

  removeSession (sessionKey) {
    this.sessions.splice(this.sessions.indexOf(sessionKey), 1);
    delete this.sessionData[sessionKey];

    if (!this.sessions.length) {
      this.sessionStared = false;
    }
  }

  create (table, data) {
    return this.adapter.create(table, data).then((insertedData) => {
      this.saveSessionData(table, insertedData);
      return true;
    });
  };

  remove (table, data) {
    return this.adapter.remove(table, data).then(() => true);
  };

  update (table, data, constraints) {
    if (data instanceof Array) {
      return this.doMultipleUpdate(table, data, constraints);
    } else if (data instanceof Object) {
      return this.doMultipleUpdate(table, [data], constraints);
    }
  };

  doMultipleUpdate (table, updateData, constraints) {
    const promiseQueue = [];

    for (let singleUpdate of updateData) {
      const fields = Object.keys(singleUpdate);

      if (fields.indexOf('id') === -1) {
        fields.unshift('id');
      }

      promiseQueue.push(this.adapter.select(table, fields, constraints).then(data => data[0]));
    }

    return Promise.all(promiseQueue).then(data => {
      const updateQueue = [];

      for (const updateNumber in data) {
        const updates = data[updateNumber];
        const idList = updates.map(e => e.id);

        this.saveSessionData(table, updates);
        updateQueue.push(this.adapter.update(table, updateData[updateNumber], idList));
      }

      return Promise.all(updateQueue);
    });
  }
};

module.exports.Fabricator = Fabricator;
module.exports.MySQLAdapter = MySQLAdapter;