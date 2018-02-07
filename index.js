'use strict'
module.exports = MicroRouter

function MicroRouter (matcher) {
  if (!matcher || typeof matcher.path !== 'function' || typeof matcher.method !== 'function') {
    throw new Error('a valid matcher is required')
  }
  if (!(this instanceof MicroRouter)) {
    return new MicroRouter(matcher)
  }

  const router = function mr (req, res, final) {
    router.handle(req, res, final || function (req, res) {
      res.setHeader('content-type', 'text/plain')
      res.end('404 Not Found')
    })
  }
  Object.setPrototypeOf(router, this)

  router.matcher = matcher
  router.layers = []

  return router
}
MicroRouter.prototype = Object.create(Function.prototype)

MicroRouter.METHODS = [
  'GET',
  'POST',
  'PUT',
  'DELETE',
  'PATCH',
  'HEAD',
  'OPTIONS'
]

MicroRouter.prototype.handle = function microRouterUse (req, res, final) {
  let pathMatch = false
  let methodMatch = false
  let cur = -1
  const stack = this.layers
  const next = (err) => {
    cur++
    if (cur === stack.length) {
      if (err) {
        res.statusCode = 500
      } else {
        res.statusCode = (pathMatch && !methodMatch) ? 405 : 404
      }
      return final(req, res)
    }

    if ((err && !stack[cur].handlesErrors) || stack[cur].handlesErrors) {
      return next(err)
    }

    // Match path
    const params = stack[cur].matchPath(req.url)
    if (params === false) {
      return next()
    }
    pathMatch = true

    // Match methods
    if (stack[cur].matchMethod(req.method)) {
      return next()
    }
    methodMatch = true

    // Call handler
    try {
      if (err) {
        stack[cur].handler(err, req, res, params, next)
      } else {
        stack[cur].handler(req, res, params, next)
      }
    } catch (e) {
      next(e)
    }
  }

  next()
}

MicroRouter.prototype.use = function microRouterUse (path, methods, handler) {
  use(this, path, methods, handler, false)
}

MicroRouter.prototype.error = function microRouterError (path, methods, handler) {
  use(this, path, methods, handler, true)
}

MicroRouter.METHODS.forEach(function (method) {
  MicroRouter.prototype[method.toLowerCase()] = function (path, handler) {
    if (typeof path === 'function') {
      handler = path
      path = null
    }
    use(this, path, method, handler, false)
  }
})

function use (router, _path, _methods, _handler, handlesErrors) {
  let {path, methods, handler} = args(_path, _methods, _handler)
  router.layers.push({
    matchPath: router.matcher.path(path),
    matchMethod: router.matcher.method(methods),
    handler: handler,
    handlesErrors: handlesErrors
  })
}

function args (path, methods, handler) {
  if (typeof path === 'function') {
    handler = path
    methods = null
    path = null
  } else if (typeof methods === 'function') {
    handler = methods
    methods = null
  }
  return {path, methods, handler}
}
