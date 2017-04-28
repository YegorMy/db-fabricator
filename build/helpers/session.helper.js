'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var uuid = require('uuid').v4;

/**
 * @class SessionHelper
 */

var SessionHelper = function () {
  function SessionHelper(adapter) {
    _classCallCheck(this, SessionHelper);

    this.sessionStared = false;
    this.sessionData = {};
    this.sessions = [];

    this.adapter = adapter;
  }

  _createClass(SessionHelper, [{
    key: 'startSession',


    /**
     * @function SessionHelper.startSession
     * @description Starts new session. Sets flag sessionStarted to false and inserts new uuid into session list
     */

    value: function startSession() {
      this.sessionStared = true;
      this.sessions.unshift(uuid());
    }
  }, {
    key: 'stopSession',


    /**
     * @function SessionHelper.stopSession
     * @description Stops last started session. Restores all affected session data and removes session.
     * @returns {Promise} - will be resolved when data is deleted
     */

    value: function stopSession() {
      var _this = this;

      var latestSessionKey = this.getLatestSessionKey();

      return this.removeSessionData(latestSessionKey).then(function () {
        _this.removeSession(latestSessionKey);

        return true;
      });
    }
  }, {
    key: 'getLatestSessionKey',


    /**
     * @function SessionHelper.getLatestSessionKey
     * @description Returns uuid of latest session
     * @returns {string} - uuid of latest session
     */

    value: function getLatestSessionKey() {
      return this.sessions[0];
    }
  }, {
    key: 'saveSessionData',


    /**
     * @function SessionHelper.saveSessionData
     * @description Saves data to the latest session. This data will be removed or updated when current session will be closed. Contains only data from updates and creates.
     * @param {string} table - Table where we modify data
     * @param {number[]|number|object|object[]} insertedData - data that was created or updated
     */

    value: function saveSessionData(table, insertedData) {
      var latestSessionKey = this.getLatestSessionKey();

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
          var _iteratorNormalCompletion = true;
          var _didIteratorError = false;
          var _iteratorError = undefined;

          try {
            for (var _iterator = insertedData[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              var data = _step.value;

              this.sessionData[latestSessionKey][table].push(data);
            }
          } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
              }
            } finally {
              if (_didIteratorError) {
                throw _iteratorError;
              }
            }
          }
        }
      } else {
        this.sessionData[latestSessionKey][table].push(insertedData);
      }
    }
  }, {
    key: 'removeSessionData',


    /**
     * @function SessionHelper.removeSessionData
     * @description Removes data from session by it's key. Removes all created data and reverting all the modified data.
     * @param {string} sessionKey - Key of the session to remove data from
     */

    value: function removeSessionData(sessionKey) {
      var promiseQueue = [];
      var sessionData = this.sessionData[sessionKey];
      if (!sessionData) {
        return Promise.resolve(true);
      }
      var sessionDataKeys = Object.keys(sessionData);

      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = sessionDataKeys[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var key = _step2.value;

          this.renderSessionData(key, sessionData[key], promiseQueue);
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }

      return Promise.all(promiseQueue);
    }
  }, {
    key: 'renderSessionData',


    /**
     * @function SessionHelper.renderSessionData
     * @description Renders data saved in session. If data[n] is a number, delete this by id. If data[n] is an object, we should restore all values from data[n] by data[n].id
     * @param {string} table - table to perform queries to
     * @param {object[]|number[]} values - data that was saved for current session
     * @param {Promise[]} promiseQueue - promise queue to execute
     */

    value: function renderSessionData(table, values, promiseQueue) {
      if (!values.length) {
        return;
      }
      var toDelete = [];
      var toUpdate = [];

      // if element of the value is simple number, that means we need to delete it.
      // if element of the value is an object, we need to modify it by id

      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = values[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var element = _step3.value;

          if (typeof element === 'number' || typeof element === 'string') {
            toDelete.push(element);
            continue;
          }

          // console.log(element);

          toUpdate.push(element);
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3.return) {
            _iterator3.return();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }

      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = toUpdate[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var _element = _step4.value;

          if (_element.__insert) {
            delete _element.__insert;

            promiseQueue.push(this.adapter.create(table, _element));
          } else if (toDelete.indexOf(_element.id) === -1) {
            var elementId = _element.id; // save id
            delete _element.id; // we don't want to update id for the element

            promiseQueue.push(this.adapter.update(table, _element, elementId));
          }
        }
      } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion4 && _iterator4.return) {
            _iterator4.return();
          }
        } finally {
          if (_didIteratorError4) {
            throw _iteratorError4;
          }
        }
      }

      var _iteratorNormalCompletion5 = true;
      var _didIteratorError5 = false;
      var _iteratorError5 = undefined;

      try {
        for (var _iterator5 = toDelete[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
          var _element2 = _step5.value;

          promiseQueue.push(this.adapter.remove(table, _element2));
        }
      } catch (err) {
        _didIteratorError5 = true;
        _iteratorError5 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion5 && _iterator5.return) {
            _iterator5.return();
          }
        } finally {
          if (_didIteratorError5) {
            throw _iteratorError5;
          }
        }
      }

      return promiseQueue;
    }
  }, {
    key: 'removeSession',


    /**
     * @function SessionHelper.removeSession
     * @description Removes session from local session key value storage. 
     * @param {string} sessionKey 
     */

    value: function removeSession(sessionKey) {
      this.sessions.splice(this.sessions.indexOf(sessionKey), 1);
      delete this.sessionData[sessionKey];

      if (!this.sessions.length) {
        this.sessionStared = false;
      }
    }
  }, {
    key: 'stopAllSessions',


    /**
     * @function SessionHelper.stopAllSessions
     * @description Stops all session one by one starting from the latest one.
     * @returns {Promise} - Will be resolved when all sessions are stopped
     */

    value: function stopAllSessions() {
      if (!this.sessions.length) {
        return Promise.resolve(true);
      }

      return this.stopSession().then(this.stopAllSessions.bind(this));
    }
  }]);

  return SessionHelper;
}();

;

module.exports = SessionHelper;