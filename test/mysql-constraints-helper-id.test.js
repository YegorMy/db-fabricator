const assert = require('chai').assert
const MysqlConstraintsHelper = require('../src/helpers/mysql-constraints.helper')

describe('generate ids', () => {
  it('should create valid query result for single digit', () => {
    assert.equal(MysqlConstraintsHelper.generateIds(1), ' = 1')
  })

  it('should create valid query result for array of single digit', () => {
    assert.equal(MysqlConstraintsHelper.generateIds([1]), ' = 1')
  })

  it('should create valid query result for array of digits', () => {
    assert.equal(MysqlConstraintsHelper.generateIds([1, 2, 3, 4]), ' IN (1,2,3,4)')
  })

  it('should create valid query result for empty array', () => {
    assert.equal(MysqlConstraintsHelper.generateIds([]), ' IN ()')
  })
})
