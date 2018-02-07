'use strict'
const tap = require('tap')
const r2 = require('r2')
const server = require('./util/server')
const matcher = require('./util/regexp-matcher')
const mr = require('..')

tap.test('work', function (t) {
  var router = mr(matcher)

  router.get('/', function (req, res) {
    res.setHeader('content-type', 'application/json')
    res.end(JSON.stringify({
      hello: 'world!'
    }))
  })

  router.use('/foo', ['GET', 'POST'], function (req, res) {
    res.setHeader('content-type', 'application/json')
    res.end(JSON.stringify({
      foo: 'bar',
      method: req.method
    }))
  })

  router.use('/:bar', 'POST', function (req, res, params, next) {
    // Dont handle /foobar
    if (params.bar === 'foobar') {
      return next()
    }

    // Error on hodor
    if (params.bar === 'hodor') {
      return next(new Error('HOLD THE DOOR'))
    }

    res.setHeader('content-type', 'application/json')
    res.end(JSON.stringify({
      foo: 'bar'
    }))
  })

  // Register an error handler
  router.error(function (err, req, res) {
    res.statusCode = 500
    res.setHeader('content-type', 'text/plain')
    res.end(err.message)
  })

  server(router, async function (s) {
    var addr = `http://127.0.0.1:${(s.address() || {}).port}`

    var res1 = await r2(addr + '/').response
    var body1 = await res1.json()
    t.equal(res1.status, 200)
    t.equal(body1.hello, 'world!')

    var res2 = await r2(addr + '/foo').response
    var body2 = await res2.json()
    t.equal(res2.status, 200)
    t.equal(body2.foo, 'bar')
    t.equal(body2.method, 'GET')

    var res3 = await r2.post(addr + '/foo').response
    var body3 = await res3.json()
    t.equal(res3.status, 200)
    t.equal(body3.foo, 'bar')
    t.equal(body3.method, 'POST')

    var res4 = await r2.post(addr + '/foobar').response
    t.equal(res4.status, 404)

    var res5 = await r2.post(addr + '/hodor').response
    t.equal(res5.status, 500)

    s.close()
    t.done()
  })
})
