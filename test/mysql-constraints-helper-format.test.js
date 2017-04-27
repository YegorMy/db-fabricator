const assert = require('chai').assert;
const MySQLConstraintsHelper = require('../src/helpers/mysql-constraints.helper');

describe('format element', () => {
  it('should correctly format a number', () => {
    assert.equal(MySQLConstraintsHelper.formatElement(123), 123);
  });

  it('should correctly format a string', () => {
    assert.equal(MySQLConstraintsHelper.formatElement('test string'), `'test string'`);
  });

  it('should correctly format a date', () => {
    const date = new Date();

    assert.equal(MySQLConstraintsHelper.formatElement(date), `'${date.toString()}'`);
  });

  it('should correctly format an array of numbers', () => {
    assert.equal(MySQLConstraintsHelper.formatElement([1, 2, 3, 4]), `'[1,2,3,4]'`);
  });

  it('should correctly format an array of strings', () => {
    assert.equal(MySQLConstraintsHelper.formatElement(['test1', 'test2', 'test3', 'test4']), `'["test1","test2","test3","test4"]'`);
  });

  it('should correctly format an array of strings an number', () => {
    assert.equal(MySQLConstraintsHelper.formatElement([1, 'test2', 3, 'test4']), `'[1,"test2",3,"test4"]'`);
  });

  it('should format object', () => {
    assert.equal(MySQLConstraintsHelper.formatElement({
      value1: 1, 
      value2: 'test'
    }), `\'{"value1":1,"value2":"test"}\'`);
  });
});