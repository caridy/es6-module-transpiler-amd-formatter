/*jshint node:true */
/*global describe,it,beforeEach */
'use strict';

var chai = require('chai'),
  expect = chai.expect,
  requirejs = require('requirejs');

requirejs.config({
  baseUrl: __dirname + '/../build'
});

describe('amd-formatter', function() {

  it('should load mod1', function(next) {
    requirejs(['test/fixtures/1'], function(mod1) {
      expect(mod1.default).to.be.a('function');
      expect(mod1.default(1, 2)).to.be.equal(3);
      next();
    });
  });

  it('should load mod2', function(next) {
    requirejs(['test/fixtures/2'], function(mod2) {
      expect(mod2.default).to.be.a('function');
      expect(mod2.default(0)).to.be.equal(false);
      expect(mod2.default(1)).to.be.equal(true);
      expect(mod2.default(2)).to.be.equal(true);
      next();
    });
  });
  
  it('should load mod3', function(next) {
    requirejs(['test/fixtures/3'], function(mod3) {
      expect(mod3.a).to.be.a('number');
      expect(mod3.b).to.be.a('number');

      next();
    });
  });

});
