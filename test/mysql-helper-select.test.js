const assert = require('chai').assert;
const MySQLHelper = require('../src/helpers/mysql.helper');

describe('Tests for MySQL Adapter select query generation', () => {
  describe('generateSelectFields', () => {
    it('should generate correct fields for empty data', () => {
      assert.equal(MySQLHelper.generateSelectFields(), '*');
    });

    it('should generate correct fields for single element array', () => {
      assert.equal(MySQLHelper.generateSelectFields(['value1']), '`value1`');
    });

    it('should generate correct fields for multiple elements array', () => {
      assert.equal(MySQLHelper.generateSelectFields(['value1', 'value2']), '`value1`,`value2`');
    });
  });

  describe('generateSelectQuery', () => {
    it('should generate correct query for empty data', () => {
      assert.equal(MySQLHelper.generateSelectQuery('TestTable'), 'SELECT * FROM `TestTable`');
    });

    it('should generate correct query for single element array', () => {
      assert.equal(MySQLHelper.generateSelectQuery('TestTable', ['value1']), 'SELECT `value1` FROM `TestTable`');
    });

    it('should generate correct query for multiple elements array', () => {
      assert.equal(MySQLHelper.generateSelectQuery('TestTable', ['value1', 'value2']), 'SELECT `value1`,`value2` FROM `TestTable`');
    });

    it('should generate correct query for multiple elements array with constraints', () => {
      assert.equal(MySQLHelper.generateSelectQuery('TestTable', ['value1', 'value2'], 'WHERE `id` > 2'), 'SELECT `value1`,`value2` FROM `TestTable` WHERE `id` > 2');
    });
  });

  describe('generateSelectQuery with constraints', () => {
    it('should generate correct query for simple constraints', () => {
      assert.equal(MySQLHelper.generateSelectQuery('TestTable', '', {
        id: 1,
        name: '123'
      }), 'SELECT * FROM `TestTable` WHERE `id` = 1 AND `name` = \'123\'');
    });

    it('should generate correct query for and constraints', () => {
      assert.equal(MySQLHelper.generateSelectQuery('TestTable', '', {
        $and: [{
          id: 1
        }, {
          name: '123'
        }]
      }), 'SELECT * FROM `TestTable` WHERE ((`id` = 1) AND (`name` = \'123\'))');
    });

    it('should generate correct query for combination of simple constraints and "AND" ones', () => {
      assert.equal(MySQLHelper.generateSelectQuery('TestTable', '', {
        $and: [{
          id: 1
        }, {
          name: '123'
        }],
        description: '123'
      }), 'SELECT * FROM `TestTable` WHERE ((`id` = 1) AND (`name` = \'123\')) AND `description` = \'123\'');
    });

    it('should generate correct query for or constraints', () => {
      assert.equal(MySQLHelper.generateSelectQuery('TestTable', '', {
        $or: [{
          id: 1
        }, {
          name: '123'
        }]
      }), 'SELECT * FROM `TestTable` WHERE ((`id` = 1) OR (`name` = \'123\'))');
    });

    it('should generate correct query for combination of simple constraints and "OR" ones', () => {
      assert.equal(MySQLHelper.generateSelectQuery('TestTable', '', {
        $or: [{
          id: 1
        }, {
          name: '123'
        }],
        description: '123'
      }), 'SELECT * FROM `TestTable` WHERE ((`id` = 1) OR (`name` = \'123\')) AND `description` = \'123\'');
    });

    it('should generate correct query for combination of all constraints', () => {
      assert.equal(MySQLHelper.generateSelectQuery('TestTable', '', {
        $or: [{
          id: 1,
          value1: 1
        }, {
          name: '123',
          value2: 2
        }],
        $and: [{
          id: 2,
          value1: 2,
        }, {
          name: '321',
          value2: 1
        }],
        description: '123'
      }), 'SELECT * FROM `TestTable` WHERE ((`id` = 1 AND `value1` = 1) OR (`name` = \'123\' AND `value2` = 2)) AND ((`id` = 2 AND `value1` = 2) AND (`name` = \'321\' AND `value2` = 1)) AND `description` = \'123\'');
    });

    it('should generate correct query for nested ands', () => {
      assert.equal(MySQLHelper.generateSelectQuery('TestTable', '', {
        $and: [{
          $and: [{
            id: 3,
            value1: 3
          }],
          id: 2,
          value1: 2,
        }, {
          name: '321',
          value2: 1
        }],
        description: '123'
      }), 'SELECT * FROM `TestTable` WHERE ((((`id` = 3 AND `value1` = 3)) AND `id` = 2 AND `value1` = 2) AND (`name` = \'321\' AND `value2` = 1)) AND `description` = \'123\'');
    });
  });
});