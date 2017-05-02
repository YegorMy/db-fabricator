const mysqlConnector = require('../connectors/mysql.connector');
const MySQLHelper = require('../helpers/mysql.helper');
const Adapter = require('./general.adapter');
const GeneratedHelper = require('../helpers/mysql-generated.helper');
const Promise = require('bluebird');

/**
 * @class MySQLAdapter
 * @description Adapter for MySQL database
 */

class MySQLAdapter extends Adapter {
  /**
   * @constructor MySQLAdapter
   * @param {object} mysqlConnectionParameters - connection parameters for mysql
   * @param {string} mysqlConnectionParameters.host - host to connect
   * @param {string} mysqlConnectionParameters.user - user to use in connection
   * @param {string} mysqlConnectionParameters.password - password for user
   * @param {string} mysqlConnectionParameters.database - database to connect to
   * @param {boolean} mysqlConnectionParameters.cacheSchema - cache schema for columns
   */
  constructor (mysqlConnectionParameters) {
    super();
    const connectionPromise = mysqlConnector(mysqlConnectionParameters);

    this.connectionPromise = connectionPromise.then(this.setConnection.bind(this));
    this.database = mysqlConnectionParameters.database;
    this.cacheSchema = mysqlConnectionParameters.cacheSchema;
    this.__cache = {};
  }

  /**
   * @function MySQLAdapter.waitForConnect
   * @description Returns promise that will be resolved when connection to DB is established. 
   * @returns {Promise<Connection>} - Promise with connection object
   */

  waitForConnect () {
    return this.connectionPromise;
  }

  /**
   * @function MySQLAdapter.setConnection
   * @description Gets connection from MySQL and sets it as class variable
   * @param {Connection} connection - connection to database
   */

  setConnection (connection) {
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

  create (table, data) {
    return this.waitForConnect().then(() => {
      return this.connection.execute(MySQLHelper.generateInsertQuery(table, data)).then(this.renderInsertResults);
    });
  }

  /**
   * @function MySQLAdapter.renderInsertResults
   * @description Renders result of the query. Transforms array of objects into array of inserted ids.
   * @param {QueryResults} results 
   * @returns {number[]} - Array of inserted numbers
   */

  renderInsertResults (results) {
    return results.filter(e => e).map(e => Number(e.insertId));
  }

  /**
   * @function MySQLAdapter.remove
   * @description Removes data by id from the table
   * @param {string} table - Name of the table to execute query on
   * @param {number|number[]} data - single id or array of ids to remove
   * @returns {Promise<void>} - Promise which will be resolved when query is finished
   */

  remove (table, data) {
    return this.waitForConnect().then(() => {
      return this.connection.execute(`
        SET foreign_key_checks = 0;
        ${MySQLHelper.generateDeleteQuery(table, data)};
        SET foreign_key_checks = 1;
      `);
    });
  }

  /**
   * @function MySQLAdapter.select
   * @description Selects data from table by passed array of fields
   * @param {string} table - table to select from
   * @param {string|string[]} fields - table fields to select
   */

  select (table, fields, constraints, hasGenerated = false) {
    return this.waitForConnect().then(() => {
      const promiseQueue = [
        this.connection.query(MySQLHelper.generateSelectQuery(table, fields, constraints))
      ];

      if (hasGenerated && !this.__cache[table]) {
        promiseQueue.push(this.searchForGeneratedColumns(table));
      } else if (hasGenerated && this.__cache[table]) {
        promiseQueue.push(Promise.resolve(this.__cache[table]));
      }

      return Promise.all(promiseQueue);
    }).then(([data, generatedColumns]) => {
      if (!generatedColumns) {
        return data;
      }

      this.storeGeneratedTablesCache(table, generatedColumns);

      return [data[0], generatedColumns];
    });
  }

  /**
   * @function MySQLAdapter.update
   * @description Updates data for table with constraints of passed list of ids
   * @param {string} table - table to update
   * @param {object} fields - fields:data to update
   * @param {number[]} constraints - list of ids to update
   */

  update (table, fields, constraints) {
    return this.waitForConnect().then(() => {
      return this.connection.query(MySQLHelper.generateUpdateQuery(table, fields, constraints));
    });
  }

  /**
   * @function MySQLAdapter.cose
   * @description Closes connection to MySQL database
   */

  disconnect () {
    return this.waitForConnect().then( () => {
      return this.connection.connection.close();
    });
  };

  searchForGeneratedColumns (table) {
    return GeneratedHelper.searchForGeneratedColumns(this.connection, this.database, table);
  };

  storeGeneratedTablesCache (table, dataToStore) {
    this.__cache[table] = dataToStore;
  }

  setForeignKeyChecks (value = 0) {
    return this.connection.execute(`SET GLOBAL foreign_key_checks = ${value}`);
  }
}

module.exports = MySQLAdapter;