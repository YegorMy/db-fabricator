/**
 * @class MysqlConstraintsHelper
 * @description Class for transforming loopback-like filters into realy mysql constraints
 */

const MysqlConstraintsHelper = {
  generateSelectConstraints (constraints) {
    if (!constraints) {
      return '';
    }

    if (typeof constraints === 'string') {
      return ` ${constraints}`;
    }

    return ` WHERE ${this.convertObjectToConstraints(constraints)}`;
  },

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

  convertToRightPartOfConstraint (data) {
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
        return ` IN (${data.join(',')})`;
      }
    }

    return ` = ${currentData}`;
  },

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