'use strict';

var MySQLHelper = require('./mysql.helper');
var clone = require('lodash.clone');

var GeneratedHelper = {
  searchForGeneratedColumns: function searchForGeneratedColumns(connection, database, tableName) {
    var query = MySQLHelper.generateSelectQuery('`information_schema`.`COLUMNS`', ['COLUMN_NAME', 'EXTRA'], {
      TABLE_SCHEMA: database,
      TABLE_NAME: tableName,
      $or: [{
        EXTRA: {
          $like: '%GENERATED%'
        }
      }, {
        EXTRA: {
          $like: '%VIRTUAL%'
        }
      }]
    });

    return connection.query(query).then(function (data) {
      return data[0];
    }).then(this.createGeneratedKV);
  },
  createGeneratedKV: function createGeneratedKV(data) {
    var generatedKV = {};

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = data[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var element = _step.value;

        generatedKV[element.COLUMN_NAME] = true;
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

    return generatedKV;
  },
  renderQueryResultWithGeneratedColumns: function renderQueryResultWithGeneratedColumns(data, generatedColumns) {
    var columnsDescription = data[1];

    for (var key in columnsDescription) {
      columnsDescription[key] = columnsDescription[key].inspect();
      var column = columnsDescription[key];

      if (generatedColumns[column.orgName]) {
        column.generated = true;
      }
    }

    return data;
  },
  createDataToStoreInSession: function createDataToStoreInSession(initialData, generatedColumns) {
    var dataToStoreInSession = [];

    for (var i in initialData) {
      var el = clone(initialData[i]);

      var keys = Object.keys(el);

      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = keys[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var key = _step2.value;

          if (generatedColumns[key]) {
            delete el[key];
          }
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

      el.__insert = true;
      dataToStoreInSession.push(el);
    }

    return dataToStoreInSession;
  }
};

module.exports = GeneratedHelper;