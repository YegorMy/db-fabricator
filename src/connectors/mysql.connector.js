const mysql = require('mysql2/promise')
const bluebird = require('bluebird')

/**
 * @function MySQLConnector
 * @description Creates connection to MySQL database.
 */

module.exports = (dbConnectionParameters) => {
  if (!dbConnectionParameters.database) {
    throw new Error('specify database please')
  }

  return mysql.createConnection({
    host: dbConnectionParameters.host || 'localhost',
    user: dbConnectionParameters.user || 'root',
    password: dbConnectionParameters.password || '',
    database: dbConnectionParameters.database || 'Ambulnz',
    Promise: bluebird
  })
}
