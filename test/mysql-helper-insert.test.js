const assert = require('chai').assert;
const MySQLHelper = require('../src/helpers/mysql.helper');

describe('Tests for MySQL Adapter insert query generation', () => {
  describe('value generation', () => {
    it('should generate empty insert query for empty data', () => {
      assert.equal(MySQLHelper.generateValues({}), '() VALUES()');
    });

    it('should generate correct insert query for numbers', () => {
      assert.equal(MySQLHelper.generateValues({
        value1: 1, 
        value2: 2,
      }), '(value1, value2) VALUES(1, 2)');
    });

    it('should generate correct insert query for strings', () => {
      assert.equal(MySQLHelper.generateValues({
        value1: 'test1', 
        value2: 'test2',
      }), '(value1, value2) VALUES(\'test1\', \'test2\')');
    });

    it('should generate correct insert query for date', () => {
      const date = new Date();
      
      assert.equal(MySQLHelper.generateValues({
        value1: date,
      }), `(value1) VALUES(\'${date.toString()}\')`);
    });

    it('should generate correct insert query for array', () => {
      assert.equal(MySQLHelper.generateValues({
        value1: [1, 2, 3],
      }), '(value1) VALUES(\'[1,2,3]\')');
    });

    it('should generate correct insert query for object', () => {
      assert.equal(MySQLHelper.generateValues({
        value1: {
          value1: 1,
        },
      }), '(value1) VALUES(\'{"value1":1}\')');
    });

    it('should generate correct insert query for nested object', () => {
      assert.equal(MySQLHelper.generateValues({
        value1: {
          value1: {
            value2: 2,
          },
        },
      }), '(value1) VALUES(\'{"value1":{"value2":2}}\')');
    });
  });

  describe('insert query generation', () => {
    it('should generate empty insert query', () => {
      assert.equal(MySQLHelper.generateInsertQuery('', {}), 'INSERT INTO `` () VALUES()');
    });

    it('should generate correct insert query for numbers', () => {
      assert.equal(MySQLHelper.generateInsertQuery('TestTable', {
        value1: 1,
        value2: 2,
        value3: 3,
      }), 'INSERT INTO `TestTable` (value1, value2, value3) VALUES(1, 2, 3)');
    });

    it('should generate correct insert query for strings', () => {
      assert.equal(MySQLHelper.generateInsertQuery('TestTable', {
        value1: 'test value1',
        value2: 'test value2',
        value3: 'test value3',
      }), 'INSERT INTO `TestTable` (value1, value2, value3) VALUES(\'test value1\', \'test value2\', \'test value3\')');
    });

    it('should generate correct insert query for array', () => {
      assert.equal(MySQLHelper.generateInsertQuery('TestTable', {
        value1: [1, 'test value', [2, 'test value2']],
      }), 'INSERT INTO `TestTable` (value1) VALUES(\'[1,"test value",[2,"test value2"]]\')');
    });

    it('should generate correct insert query for date', () => {
      const date = new Date();

      assert.equal(MySQLHelper.generateInsertQuery('TestTable', {
        value1: date,
      }), `INSERT INTO \`TestTable\` (value1) VALUES('${date.toString()}')`);
    });

    it('should generate correct insert query for object', () => {
      assert.equal(MySQLHelper.generateInsertQuery('TestTable', {
        value1: {
          value1: 1,
          value2: 'test value',
        },
      }), 'INSERT INTO `TestTable` (value1) VALUES(\'{"value1":1,"value2":"test value"}\')');
    });
  });
});