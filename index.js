'use strict'
const LRU = require('./lib/lru')

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
  router.cache = LRU()

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
  let matchedLayers = []
  let pathMatch = false
  let methodMatch = false
  let cur = -1

  // Check in cache
  let key = cacheKey(req)
  let cached = this.cache.get(key)
  let stack = cached || this.layers

  const next = (err) => {
    cur++
    // Check if fully done
    if (cur === stack.length && cur === this.layers.length) {
      if (err) {
        res.statusCode = 500
      } else {
        res.statusCode = (pathMatch && !methodMatch) ? 405 : 404
      }
      return final(req, res)
    } else if (cur === stack.length) {
      // If we reached the end of the stack, but that is not
      // the end of the layers, tack on the remaining layers
      // to ensure that we give them the chance to match this time around
      stack = stack.concat(this.layers.slice(cur, this.layers.length))
    }

    // Match path
    const params = stack[cur].cachedParams || stack[cur].matchPath(req.url)
    if (params === false) {
      return next()
    }
    pathMatch = true

    // Match methods
    if (!stack[cur].cachedMethodMatch && stack[cur].matchMethod(req.method)) {
      return next()
    }
    methodMatch = true

    // Add to matched layers
    matchedLayers.push({
      handler: stack[cur].handler,
      handlesErrors: stack[cur].handlesErrors,
      cachedParams: params,
      cachedMethodMatch: true
    })

    // Add or update the match in the cache with the longer of the stacks
    this.cache.set(key, (cached && cached.length >= matchedLayers.length) ? cached : matchedLayers)

    if ((err && !stack[cur].handlesErrors) || (!err && stack[cur].handlesErrors)) {
      return next(err)
    }

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
  return use(this, path, methods, handler, false)
}

MicroRouter.prototype.error = function microRouterError (path, methods, handler) {
  return use(this, path, methods, handler, true)
}

MicroRouter.METHODS.forEach(function (method) {
  MicroRouter.prototype[method.toLowerCase()] = function (path, handler) {
    if (typeof path === 'function') {
      handler = path
      path = null
    }
    return use(this, path, method, handler, false)
  }
})

function use (router, _path, _methods, _handler, handlesErrors) {
  let {path, methods, handler} = args(_path, _methods, _handler)
  if (typeof handler !== 'function') {
    throw new TypeError('handler must be a function')
  }

  router.layers.push({
    matchPath: router.matcher.path(path),
    matchMethod: router.matcher.method(methods),
    handler: handler,
    handlesErrors: handlesErrors
  })

  return router
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

function cacheKey (req) {
  return req.method + ':' + req.url
}
