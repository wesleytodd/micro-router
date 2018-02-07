'use strict'
const pathToRegexp = require('path-to-regexp')
const mr = require('../..')

module.exports = {
  path: function (route) {
    if (!route) {
      route = '(.*)'
    }

    var keys = []
    var re = pathToRegexp(route, keys)
    return function (path) {
      var match = re.exec(path)
      if (!match) {
        return false
      }
      return keys.reduce(function (params, key, index) {
        var i = index + 1
        if (match[i]) {
          params[key.name] = match[i]
        }
        return params
      }, {})
    }
  },
  method: function (methods) {
    if (!methods) {
      methods = mr.METHODS
    }
    methods = (typeof methods === 'string' ? [methods] : methods).map(m => m.toUpperCase())

    return function (method) {
      return methods.indexOf(method) === -1
    }
  }
}
