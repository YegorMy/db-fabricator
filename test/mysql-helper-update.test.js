const assert = require('chai').assert
const MySQLHelper = require('../src/helpers/mysql.helper')

describe('Tests for MySQL Adapter update query generation', () => {
  describe('generateUpdateFields', () => {
    it('should return empty string for empty object', () => {
      assert.equal(MySQLHelper.generateUpdateFields({}), '')
    })

    it('should generate correct result for one field', () => {
      assert.equal(MySQLHelper.generateUpdateFields({
        name: '123'
      }), '`name` = \'123\'')
    })

    it('should generate correct result for multiple fields', () => {
      assert.equal(MySQLHelper.generateUpdateFields({
        name: '123',
        value1: 1
      }), '`name` = \'123\', `value1` = 1')
    })
  })

  describe('Generate correct SQL UPDATE queries', () => {
    it('should generate correct query for one field without constraints', () => {
      assert.equal(MySQLHelper.generateUpdateQuery('TestTable', {
        name: '123'
      }), 'UPDATE `TestTable` SET `name` = \'123\'')
    })

    it('should generate correct query for multiple fields without constraints', () => {
      assert.equal(MySQLHelper.generateUpdateQuery('TestTable', {
        name: '123',
        value1: 1
      }), 'UPDATE `TestTable` SET `name` = \'123\', `value1` = 1')
    })

    it('should generate correct query for multiple fields with single constraint', () => {
      assert.equal(MySQLHelper.generateUpdateQuery('TestTable', {
        name: '123',
        value1: 1
      }, 1), 'UPDATE `TestTable` SET `name` = \'123\', `value1` = 1 WHERE `id` = 1')
    })

    it('should generate correct query for multiple fields with multiple constraints', () => {
      assert.equal(MySQLHelper.generateUpdateQuery('TestTable', {
        name: '123',
        value1: 1
      }, [1, 2, 3]), 'UPDATE `TestTable` SET `name` = \'123\', `value1` = 1 WHERE `id` IN (1,2,3)')
    })
  })
})
