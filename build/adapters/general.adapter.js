"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @class Adapter
 * @description General class for adapters to check whether passed adaptor is instance of Adaptor class.
 */

var Adapter = function Adapter() {
  _classCallCheck(this, Adapter);

  this.connectionPromise = null;
  this.connection = null;
};

module.exports = Adapter;