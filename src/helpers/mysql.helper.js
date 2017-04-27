const MysqlConstraintsHelper = require('./mysql-constraints.helper.js');

const MySQLHelper = {
  /**
   * @function MySQLHelper.generateDeleteQuery
   * @description Generates SQL INSERT query
   * @param {string} table - table to insert from to
   * @param {string|string[]} data - data to insert
   * @return {string} - DELETE query
   */

  generateInsertQuery (table, data) {
    return `INSERT INTO \`${table}\` ${this.generateValues(data)}`
  },

  /**
   * @function MySQLHelper.generateDeleteQuery
   * @description Generates SQL DELETE query
   * @param {string} table - table to select from
   * @param {string|string[]} fields - ids to delete
   * @return {string} - DELETE query
   */

  generateDeleteQuery (table, data) {
    return `DELETE FROM \`${table}\` where \`id\`${MysqlConstraintsHelper.generateIds(data)}`;
  },
  
  /**
   * @function MySQLHelper.generateSelectQuery
   * @description Generates SQL SELECT query
   * @param {string} table - table to select from
   * @param {string|string[]} fields - fields to select
   * @return {string} - select query
   */

  generateSelectQuery (table, fields, constraints) {
    return `SELECT ${this.generateSelectFields(fields)} FROM \`${table}\`${MysqlConstraintsHelper.generateSelectConstraints(constraints)}`;
  },

  /**
   * @function MySQLHelper.generateUpdateQuery
   * @description Generates SQL UPDATE query
   * @param {string} table - table to update
   * @param {object} data - fields:data to update
   * @param {number[]} constraints - list of ids to update
   */

  generateUpdateQuery (table, data, constraints) {
    let query = `UPDATE \`${table}\` SET ${this.generateUpdateFields(data)}`;

    if (constraints) {
      query += ` WHERE \`id\`${MysqlConstraintsHelper.generateIds(constraints)}`;
    }
    
    return query;
  },

  generateValues (data) {
    const keys = Object.keys(data);
    const values = [];
    let resultQuery = `(${keys.join(', ')})`;

    for (const key of keys) {
      const element = data[key];
      values.push(MysqlConstraintsHelper.formatElement(element));
    }

    return `${resultQuery} VALUES(${values.join(', ')})`;
  },

  generateUpdateFields (data) {
    const keys = Object.keys(data);
    const values = [];

    for (const key of keys) {
      values.push(`\`${key}\` = ${MysqlConstraintsHelper.formatElement(data[key])}`);
    }

    return values.join(', ');
  },

  generateSelectFields (data) {
    if (!data) {
      return '*';
    }
    
    return data.map(el => `\`${el}\``).join(',');
  }
};

module.exports = MySQLHelper;