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
      expect(mod3.a).to.be.equal(10);
      expect(mod3.b).to.be.equal(20);
      expect(mod3.c).to.be.equal(undefined);
      expect(mod3.z()).to.be.equal(30);
      next();
    });
  });

  it('should support import namespace', function(next) {
    requirejs(['test/fixtures/4'], function(mod4) {
      expect(mod4.default.length).to.be.equal(3);
      expect(mod4.default[0]).to.be.equal('a');
      expect(mod4.default[1]).to.be.equal('b');
      expect(mod4.default[2]).to.be.equal('z');
      next();
    });
  });

});
