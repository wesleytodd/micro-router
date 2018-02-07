'use strict'
// Credit where credit is due:
// https://github.com/dominictarr/hashlru/blob/master/index.js
//
// This is really just a stripped down version of hashlru

module.exports = function LRU (max = 100) {
  var size = 0
  var cache = Object.create(null)
  var _cache = Object.create(null)

  function update (key, value) {
    cache[key] = value
    size++
    if (size >= max) {
      size = 0
      _cache = cache
      cache = Object.create(null)
    }
  }

  return {
    get: function (key) {
      var v = cache[key]
      if (v !== undefined) {
        return v
      }
      if ((v = _cache[key]) !== undefined) {
        update(key, v)
        return v
      }
    },
    set: function (key, value) {
      if (cache[key] !== undefined) {
        cache[key] = value
      } else {
        update(key, value)
      }
    }
  }
}
