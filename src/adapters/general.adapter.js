/**
 * @class Adapter
 * @description General class for adapters to check whether passed adaptor is instance of Adaptor class.
 */

class Adapter {
  constructor () {
    this.connectionPromise = null;
    this.connection = null;
  };
}

module.exports = Adapter;