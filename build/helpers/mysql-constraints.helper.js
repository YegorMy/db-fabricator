'use strict';

/**
 * @class MysqlConstraintsHelper
 * @description Class for transforming loopback-like filters into realy mysql constraints
 */

var MysqlConstraintsHelper = {
  /**
   * @function MysqlConstraintsHelper.generateSelectConstraints
   * @description Function that generates MySQL constraints for query. You can pass loopback-like filters or just a string with your own constraints.
   * @param {object|string} constraints - constraints to add to the query.
   */
  generateSelectConstraints: function generateSelectConstraints(constraints) {
    if (!constraints) {
      return '';
    }

    if (typeof constraints === 'string') {
      return ' ' + constraints;
    }

    return ' WHERE ' + this.convertObjectToConstraints(constraints);
  },


  /**
   * @function MysqlConstraintsHelper.convertObjectToConstraints
   * @description Function that converts loopback-like filters into MySQL constraints.
   * @param {object} constraints - loopback-like constraint to convert to MySQL ones
   * @param {string} toJOIN - What do we use as separator for queries. AND is default. Is used in recursive calls.
   */

  convertObjectToConstraints: function convertObjectToConstraints(constraints) {
    var toJOIN = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'AND';

    var selectConstraints = [];

    if (constraints instanceof Array) {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = constraints[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var value = _step.value;

          selectConstraints.push('(' + this.convertObjectToConstraints(value, 'AND') + ')');
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
    } else {
      for (var key in constraints) {
        if (key === '$query') {
          selectConstraints.push(constraints[key]);
        } else if (key === '$and') {
          selectConstraints.push('(' + this.convertObjectToConstraints(constraints.$and, 'AND') + ')');
        } else if (key === '$or') {
          selectConstraints.push('(' + this.convertObjectToConstraints(constraints.$or, 'OR') + ')');
        } else {
          selectConstraints.push('`' + key + '`' + this.convertToRightPartOfConstraint(constraints[key]));
        }
      }
    }

    return selectConstraints.join(' ' + toJOIN + ' ');
  },


  /**
   * @function MysqlConstraintsHelper.convertToRightPartOfConstraint
   * @description Converts loopback-like element of the constraint to MySQL one. Example: {$like: '1'} -> " LIKE '1'"
   * @param {object|string} data - one simple loopback-like element of the constraint.
   */

  convertToRightPartOfConstraint: function convertToRightPartOfConstraint(data) {
    var _this = this;

    if (typeof data === 'string' || typeof data === 'number') {
      return ' = ' + this.formatElement(data);
    }

    if (data.$like) {
      return ' like \'' + data.$like + '\'';
    }

    if (data.$gt) {
      return ' > ' + data.$gt;
    }

    if (data.$lt) {
      return ' < ' + data.$lt;
    }

    if (data.$gte) {
      return ' >= ' + data.$gte;
    }

    if (data.$lte) {
      return ' <= ' + data.$lte;
    }

    if (data.$ne) {
      return ' <> ' + this.formatElement(data.$ne);
    }

    if (data.$in) {
      return this.generateIds(data.$in.map(function (e) {
        return _this.formatElement(e);
      }));
    }

    throw new Error('Unrecognized pattern ' + JSON.stringify(data));
  },


  /**
   * @function MysqlConstraintsHelper.generateIds
   * @description Generates part of query. Can accept single id or array of ids.
   * @param {number|number[]} data - single id or array of ids
   * @return {string} - generated part of query
   */

  generateIds: function generateIds(data) {
    var isArray = false;
    var currentData = data;

    if (data instanceof Array) {
      if (data.length === 1) {
        currentData = data[0];
      } else {
        return ' IN (' + data.join(',') + ')';
      }
    }

    return ' = ' + currentData;
  },


  /**
   * @function MysqlConstraintsHelper.formatElement
   * @description Transforms JS object into string for MySQL
   * @param {string|Date|Array|Object} element - element to transform into string
   */

  formatElement: function formatElement(element) {
    if (typeof element === 'string') {
      return '\'' + element + '\'';
    }
    if (element instanceof Date) {
      return '\'' + element.toString() + '\'';
    }
    if (element instanceof Object) {
      return '\'' + JSON.stringify(element) + '\'';
    }

    return element;
  }
};

module.exports = MysqlConstraintsHelper;