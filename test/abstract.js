const tap = require('tap')
var Router = require('../')
const matcher = require('./util/regexp-matcher')
const harnes = require('abstract-router-harness')

tap.test('abstract', function (t) {
  harnes.tests(Router, {
    constructorArgs: [matcher],
    supportsMultipleArgs: false
  }, t.done)
})

tap.test('benchmarks', function (t) {
  harnes.benchmarks(Router, {
    constructorArgs: [matcher],
    supportsMultipleArgs: false
  }, t.done)
})
