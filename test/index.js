'use strict'
const { describe, it } = require('mocha')
const assert = require('assert')
const r2 = require('r2')
const harness = require('abstract-router-harness')
const server = require('./util/server')
const matcher = require('./util/regexp-matcher')
const mr = require('..')

describe('@wesleytodd/micro-router', function () {
  it('should run the abstract test harness', (done) => {
    harness.tests(mr, {
      constructorArgs: [matcher],
      supportsMultipleArgs: false
    }, done)
  })

  it('should work...', (done) => {
    const router = mr(matcher)

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
      assert.strictEqual(res1.status, 200)
      assert.strictEqual(body1.hello, 'world!')

      var res2 = await r2(addr + '/foo').response
      var body2 = await res2.json()
      assert.strictEqual(res2.status, 200)
      assert.strictEqual(body2.foo, 'bar')
      assert.strictEqual(body2.method, 'GET')

      var res3 = await r2.post(addr + '/foo').response
      var body3 = await res3.json()
      assert.strictEqual(res3.status, 200)
      assert.strictEqual(body3.foo, 'bar')
      assert.strictEqual(body3.method, 'POST')

      var res4 = await r2.post(addr + '/foobar').response
      assert.strictEqual(res4.status, 404)

      var res5 = await r2.post(addr + '/hodor').response
      assert.strictEqual(res5.status, 500)

      // Retry to ensure cache is working in all cases
      var res6 = await r2.post(addr + '/foo').response
      var body6 = await res6.json()
      assert.strictEqual(res6.status, 200)
      assert.strictEqual(body6.foo, 'bar')
      assert.strictEqual(body6.method, 'POST')

      var res7 = await r2.post(addr + '/foobar').response
      assert.strictEqual(res7.status, 404)

      var res8 = await r2.post(addr + '/hodor').response
      assert.strictEqual(res8.status, 500)

      s.close()
      done()
    })
  })
})
