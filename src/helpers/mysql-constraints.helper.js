/**
 * @class MysqlConstraintsHelper
 * @description Class for transforming loopback-like filters into realy mysql constraints
 */

const MysqlConstraintsHelper = {
  /**
   * @function MysqlConstraintsHelper.generateSelectConstraints
   * @description Function that generates MySQL constraints for query. You can pass loopback-like filters or just a string with your own constraints.
   * @param {object|string} constraints - constraints to add to the query.
   */
  generateSelectConstraints (constraints) {
    if (!constraints) {
      return '';
    }

    // constraints can be either a string " WHERE `id` = 1"

    if (typeof constraints === 'string') {
      return ` ${constraints}`;
    }

    // or a single digit

    if (typeof constraints === 'number') {
      return ` WHERE \`id\` = ${constraints}`;
    }

    // or an array of ids [1,2,3,4]

    if (constraints instanceof Array) {
      return ` WHERE \`id\`${this.generateIds(constraints)}`;
    }

    // or a filter

    return ` WHERE ${this.convertObjectToConstraints(constraints)}`;
  },

  /**
   * @function MysqlConstraintsHelper.convertObjectToConstraints
   * @description Function that converts loopback-like filters into MySQL constraints.
   * @param {object} constraints - loopback-like constraint to convert to MySQL ones
   * @param {string} toJOIN - What do we use as separator for queries. AND is default. Is used in recursive calls.
   */

  convertObjectToConstraints (constraints, toJOIN = 'AND') {
    let selectConstraints = [];

    if (constraints instanceof Array) {
      for (const value of constraints) {
        selectConstraints.push(`(${this.convertObjectToConstraints(value, 'AND')})`);
      }
    } else {
      for (const key in constraints) {
        if (key === '$query') {
          selectConstraints.push(constraints[key]);
        } else if (key === '$and') {
          selectConstraints.push(`(${this.convertObjectToConstraints(constraints.$and, 'AND')})`);
        } else if (key === '$or') {
          selectConstraints.push(`(${this.convertObjectToConstraints(constraints.$or, 'OR')})`);
        } else {
          selectConstraints.push(`\`${key}\`${this.convertToRightPartOfConstraint(constraints[key])}`);
        }
      }
    }
    
    return selectConstraints.join(` ${toJOIN} `);
  },

  /**
   * @function MysqlConstraintsHelper.convertToRightPartOfConstraint
   * @description Converts loopback-like element of the constraint to MySQL one. Example: {$like: '1'} -> " LIKE '1'"
   * @param {object|string} data - one simple loopback-like element of the constraint.
   * @param {boolean} noNested - if $or, $and or $json appears when noNested is true throw an Error
   */

  convertToRightPartOfConstraint (data, noNested = false) {
    if (noNested && (data.$json || data.$or || data.$and)) {
      throw new Error('$json can not nest $or, $and or $json');
    }

    if (typeof data === 'string' || typeof data === 'number') {
      return ` = ${this.formatElement(data)}`;
    }

    if (data.$like) {
      return ` like '${data.$like}'`;
    }

    if (data.$gt) {
      return ` > ${data.$gt}`
    }

    if (data.$lt) {
      return ` < ${data.$lt}`;
    }

    if (data.$gte) {
      return ` >= ${data.$gte}`;
    }

    if (data.$lte) {
      return ` <= ${data.$lte}`;
    }

    if (data.$ne) {
      return ` <> ${this.formatElement(data.$ne)}`;
    }

    if (data.$in) {
      return this.generateIds(data.$in);
    }

    if (data.$json) {
      return `->'$.${data.$json.key}'${this.convertToRightPartOfConstraint(data.$json.value, true)}`
    }

    if (data.$exists === true) {
      return ' is not null';
    }

    if (data.$exists === false) {
      return ' is null';
    }

    throw new Error(`Unrecognized pattern ${JSON.stringify(data)}`);
  },

  /**
   * @function MysqlConstraintsHelper.generateIds
   * @description Generates part of query. Can accept single id or array of ids.
   * @param {number|number[]} data - single id or array of ids
   * @return {string} - generated part of query
   */

  generateIds (data) {
    let isArray = false;
    let currentData = data;

    if (data instanceof Array) {
      if (data.length === 1) {
        currentData = data[0];
      } else {
        return ` IN (${data.map(e => this.formatElement(e)).join(',')})`;
      }
    }

    return ` = ${this.formatElement(currentData)}`;
  },

  /**
   * @function MysqlConstraintsHelper.formatElement
   * @description Transforms JS object into string for MySQL
   * @param {string|Date|Array|Object} element - element to transform into string
   */

  formatElement (element) {
    if (typeof element === 'string') {
      return `'${element}'`;
    }
    if (element instanceof Date) {
      return `'${element.toString()}'`;
    }
    if (element instanceof Object) {
      return `'${JSON.stringify(element)}'`;
    }

    return element;
  },
};

module.exports = MysqlConstraintsHelper;