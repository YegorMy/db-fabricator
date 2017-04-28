'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Adapter = require('./adapters/general.adapter');
var MySQLAdapter = require('./adapters/mysql.adapter');
var GeneratedHelper = require('./helpers/mysql-generated.helper');
var SessionHelper = require('./helpers/session.helper');
var Promise = require('bluebird');

/**
 * @class Fabricator
 * @description Main Class to fabricate the data in databases
 */

var Fabricator = function () {
  /**
   * @constructor
   * @description Gets and adapter and sets up it as property of the class. 
   * @param {Adapter} adapter - Adapter to connect the database
   */
  function Fabricator(adapter) {
    _classCallCheck(this, Fabricator);

    this.adapter = null;

    if (!adapter instanceof Adapter) {
      throw new Error('Unsupported Adapter');
    }

    this.adapter = adapter;
    this.sessionManager = new SessionHelper(this.adapter);
  }

  _createClass(Fabricator, [{
    key: 'startSession',


    /**
     * @function Fabricator.startSession
     * @description Starts session. If session is started all modified or created data will be removed and restored at the end of current sessions. <br/> You can create more than one session and nest it in.
     */

    value: function startSession() {
      this.sessionManager.startSession();
    }
  }, {
    key: 'stopSession',


    /**
     * @function Fabricator.stopSession
     * @description Stops last created session. Restores all the data that was created or updated during this session.
     * @returns {Promise} - will be resolved when data is restored
     */

    value: function stopSession() {
      this.sessionManager.stopSession();
    }
  }, {
    key: 'create',


    /**
     * @function Fabricator.create
     * @description Creates record in database with data. Stores id of created entity in local session if session is started.
     * @param {string} table - table to query against
     * @param {*} data - data to instert
     */

    value: function create(table, data) {
      var _this = this;

      return this.adapter.create(table, data).then(function (insertedData) {
        _this.sessionManager.saveSessionData(table, insertedData);
        return insertedData[0];
      });
    }
  }, {
    key: 'remove',


    /**
     * @function Fabricator.remove
     * @description Removes all entities from table that matched passed ID list
     * @param {string} table - table to query against
     * @param {number[]|object|string} filter - filter to find rows to delete
     */

    value: function remove(table, filter) {
      var _this2 = this;

      var hasGenerated = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

      return this.adapter.select(table, '', filter, hasGenerated).then(function (data) {
        if (!data[0].length) {
          return true;
        }

        var generatedColumns = data[1];
        var dataToStoreInSession = GeneratedHelper.createDataToStoreInSession(data[0], generatedColumns);

        _this2.sessionManager.saveSessionData(table, dataToStoreInSession);

        return _this2.adapter.remove(table, filter);
      });
    }
  }, {
    key: 'update',


    /**
     * @function Fabricator.update
     * @description Updates all entities that passed constraints in the database. Stroes initial state of each found entity.
     * @param {string} table - table to query against
     * @param {object} data - data to update
     * @param {object|string} constraints - constraints for query. It can be loopback-like filter or simple string with SQL query
     */

    value: function update(table, updateData, constraints) {
      var _this3 = this;

      var promiseQueue = [];
      var fields = Object.keys(updateData);

      if (fields.indexOf('id') === -1) {
        fields.unshift('id');
      }

      return this.adapter.select(table, fields, constraints).then(function (data) {
        var initialData = data[0];
        var updateQueue = [];
        var idList = initialData.map(function (e) {
          return e.id;
        });

        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = initialData[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var update = _step.value;


            _this3.sessionManager.saveSessionData(table, update);
            updateQueue.push(_this3.adapter.update(table, updateData, idList));
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

        return Promise.all(updateQueue);
      });
    }
  }, {
    key: 'select',
    value: function select(table, fields, filter) {
      if (!filter) {
        filter = fields;
        fields = '';
      }
      return this.adapter.select(table, fields, filter).then(function (data) {
        return data[0];
      });
    }

    /**
     * @function Fabricator.closeConnection
     * @description Closes all currently active sessions and closes connection do database
     */

  }, {
    key: 'closeConnection',
    value: function closeConnection() {
      var _this4 = this;

      this.sessionManager.stopAllSessions().then(function () {
        _this4.adapter.disconnect();
      });
    }
  }]);

  return Fabricator;
}();

;

module.exports.Fabricator = Fabricator;
module.exports.MySQLAdapter = MySQLAdapter;