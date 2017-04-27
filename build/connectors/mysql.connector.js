'use strict';

var mysql = require('mysql2/promise');
var bluebird = require('bluebird');

/**
 * @function MySQLConnector
 * @description Creates connection to MySQL database.
 */

module.exports = function (dbConnectionParameters) {
  if (!dbConnectionParameters.database) {
    throw new Error('specify database please');
  }

  return mysql.createConnection({
    host: dbConnectionParameters.host || 'localhost',
    user: dbConnectionParameters.user || 'root',
    password: dbConnectionParameters.password || '',
    database: dbConnectionParameters.database || 'Ambulnz',
    Promise: bluebird
  });
};