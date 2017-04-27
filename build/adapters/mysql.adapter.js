'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var mysqlConnector = require('../connectors/mysql.connector');
var MySQLHelper = require('../helpers/mysql.helper');
var Adapter = require('./general.adapter');

/**
 * @class MySQLAdapter
 * @description Adapter for MySQL database
 */

var MySQLAdapter = function (_Adapter) {
  _inherits(MySQLAdapter, _Adapter);

  /**
   * @constructor MySQLAdapter
   * @param {object} mysqlConnectionParameters - connection parameters for mysql
   * @param {string} mysqlConnectionParameters.host - host to connect
   * @param {string} mysqlConnectionParameters.user - user to use in connection
   * @param {string} mysqlConnectionParameters.password - password for user
   * @param {string} mysqlConnectionParameters.database - database to connect to
   */
  function MySQLAdapter(mysqlConnectionParameters) {
    _classCallCheck(this, MySQLAdapter);

    var _this = _possibleConstructorReturn(this, (MySQLAdapter.__proto__ || Object.getPrototypeOf(MySQLAdapter)).call(this));

    var connectionPromise = mysqlConnector(mysqlConnectionParameters);

    _this.connectionPromise = connectionPromise.then(_this.setConnection.bind(_this));
    return _this;
  }

  /**
   * @function MySQLAdapter.waitForConnect
   * @description Returns promise that will be resolved when connection to DB is established. 
   * @returns {Promise<Connection>} - Promise with connection object
   */

  _createClass(MySQLAdapter, [{
    key: 'waitForConnect',
    value: function waitForConnect() {
      return this.connectionPromise;
    }

    /**
     * @function MySQLAdapter.setConnection
     * @description Gets connection from MySQL and sets it as class variable
     * @param {Connection} connection - connection to database
     */

  }, {
    key: 'setConnection',
    value: function setConnection(connection) {
      this.connection = connection;
      return connection;
    }
    /**
     * @function MySQLAdapter.create
     * @description Creates data in table and returns created id
     * @param {string} table - Name of the table to execute query on
     * @param {object} data - Data to insert
     * @returns {Promise<number[]>} - Promise with inserted ids
     */

  }, {
    key: 'create',
    value: function create(table, data) {
      var _this2 = this;

      return this.waitForConnect().then(function () {
        return _this2.connection.execute(MySQLHelper.generateInsertQuery(table, data)).then(_this2.renderInsertResults);
      });
    }

    /**
     * @function MySQLAdapter.renderInsertResults
     * @description Renders result of the query. Transforms array of objects into array of inserted ids.
     * @param {QueryResults} results 
     * @returns {number[]} - Array of inserted numbers
     */

  }, {
    key: 'renderInsertResults',
    value: function renderInsertResults(results) {
      return results.filter(function (e) {
        return e;
      }).map(function (e) {
        return Number(e.insertId);
      });
    }

    /**
     * @function MySQLAdapter.remove
     * @description Removes data by id from the table
     * @param {string} table - Name of the table to execute query on
     * @param {number|number[]} data - single id or array of ids to remove
     * @returns {Promise<void>} - Promise which will be resolved when query is finished
     */

  }, {
    key: 'remove',
    value: function remove(table, data) {
      var _this3 = this;

      return this.waitForConnect().then(function () {
        return _this3.connection.execute(MySQLHelper.generateDeleteQuery(table, data));
      });
    }

    /**
     * @function MySQLAdapter.select
     * @description Selects data from table by passed array of fields
     * @param {string} table - table to select from
     * @param {string|string[]} fields - table fields to select
     */

  }, {
    key: 'select',
    value: function select(table, fields, constraints) {
      var _this4 = this;

      return this.waitForConnect().then(function () {
        return _this4.connection.query(MySQLHelper.generateSelectQuery(table, fields, constraints));
      });
    }

    /**
     * @function MySQLAdapter.update
     * @description Updates data for table with constraints of passed list of ids
     * @param {string} table - table to update
     * @param {object} fields - fields:data to update
     * @param {number[]} constraints - list of ids to update
     */

  }, {
    key: 'update',
    value: function update(table, fields, constraints) {
      var _this5 = this;

      return this.waitForConnect().then(function () {
        return _this5.connection.query(MySQLHelper.generateUpdateQuery(table, fields, constraints));
      });
    }

    /**
     * @function MySQLAdapter.cose
     * @description Closes connection to MySQL database
     */

  }, {
    key: 'disconnect',
    value: function disconnect() {
      var _this6 = this;

      return this.waitForConnect().then(function () {
        return _this6.connection.connection.close();
      });
    }
  }]);

  return MySQLAdapter;
}(Adapter);

module.exports = MySQLAdapter;