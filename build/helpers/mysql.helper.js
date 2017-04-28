'use strict';

var MysqlConstraintsHelper = require('./mysql-constraints.helper.js');

var MySQLHelper = {
  /**
   * @function MySQLHelper.generateDeleteQuery
   * @description Generates SQL INSERT query
   * @param {string} table - table to insert from to
   * @param {string|string[]} data - data to insert
   * @return {string} - DELETE query
   */

  generateInsertQuery: function generateInsertQuery(table, data) {
    return 'INSERT INTO `' + table + '` ' + this.generateValues(data);
  },


  /**
   * @function MySQLHelper.generateDeleteQuery
   * @description Generates SQL DELETE query
   * @param {string} table - table to select from
   * @param {number[]|number|object} constraints - ids to delete
   * @return {string} - DELETE query
   */

  generateDeleteQuery: function generateDeleteQuery(table, constraints) {
    return 'DELETE FROM `' + table + '`' + MysqlConstraintsHelper.generateSelectConstraints(constraints);
  },


  /**
   * @function MySQLHelper.generateSelectQuery
   * @description Generates SQL SELECT query
   * @param {string} table - table to select from
   * @param {string|string[]} fields - fields to select
   * @return {string} - select query
   */

  generateSelectQuery: function generateSelectQuery(table, fields, constraints) {
    return 'SELECT ' + this.generateSelectFields(fields) + ' FROM ' + this.renderTableName(table) + MysqlConstraintsHelper.generateSelectConstraints(constraints);
  },


  /**
   * @function MySQLHelper.generateUpdateQuery
   * @description Generates SQL UPDATE query
   * @param {string} table - table to update
   * @param {object} data - fields:data to update
   * @param {number[]} constraints - list of ids to update
   */

  generateUpdateQuery: function generateUpdateQuery(table, data, constraints) {
    var query = 'UPDATE `' + table + '` SET ' + this.generateUpdateFields(data);

    if (constraints) {
      query += ' WHERE `id`' + MysqlConstraintsHelper.generateIds(constraints);
    }

    return query;
  },


  /**
   * @function MySQLHelper.generateValues
   * @description Transforms key:value pair into mysql INSERT part of the query. Example {key: 'value'} -> (key) VALUES("value")
   * @param {object} data - key:value pair to transform
   */

  generateValues: function generateValues(data) {
    var keys = Object.keys(data);
    var values = [];
    var resultQuery = '(' + keys.join(', ') + ')';

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = keys[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var key = _step.value;

        var element = data[key];
        values.push(MysqlConstraintsHelper.formatElement(element));
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

    return resultQuery + ' VALUES(' + values.join(', ') + ')';
  },


  /**
   * @function MySQLHelper.generateUpdateFields
   * @description Transforms key:value pair into mysql UPDATE part of the query. Example {key: 'value'} -> `key` = "value"
   * @param {object} data - key:value pair to transform
   */

  generateUpdateFields: function generateUpdateFields(data) {
    var keys = Object.keys(data);
    var values = [];

    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _iterator2 = keys[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        var key = _step2.value;

        values.push('`' + key + '` = ' + MysqlConstraintsHelper.formatElement(data[key]));
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

    return values.join(', ');
  },


  /**
   * @function MySQLHelper.generateSelectFields
   * @description Transforms array into mysql SELECT part of the query. Example ['field1', 'field2'] -> `fields1`,`field2`. Transforms null into '*'.
   * @param {array|null} data - array or null to transform
   */

  generateSelectFields: function generateSelectFields(data) {
    if (!data) {
      return '*';
    }

    return data.map(function (el) {
      return '`' + el + '`';
    }).join(',');
  },
  renderTableName: function renderTableName(tableName) {
    if (tableName.indexOf('`') === -1) {
      return '`' + tableName + '`';
    }

    return tableName;
  }
};

module.exports = MySQLHelper;