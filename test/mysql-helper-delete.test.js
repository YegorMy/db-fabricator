const assert = require('chai').assert
const MySQLHelper = require('../src/helpers/mysql.helper')

describe('Tests for MySQL Adapter insert query generation', () => {
  it('should create valid query for single digit', () => {
    assert.equal(MySQLHelper.generateDeleteQuery('TestTable', 1), 'DELETE FROM `TestTable` WHERE `id` = 1')
  })

  it('should create valid query for array of digits', () => {
    assert.equal(MySQLHelper.generateDeleteQuery('TestTable', [1, 2, 3, 4]), 'DELETE FROM `TestTable` WHERE `id` IN (1,2,3,4)')
  })

  it('should create valid query for empty array', () => {
    assert.equal(MySQLHelper.generateDeleteQuery('TestTable', []), 'DELETE FROM `TestTable` WHERE `id` IN ()')
  })
})
