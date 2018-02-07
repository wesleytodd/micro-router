# Micro Router

A very small, "bring your own" url matching, request router.

## Usage

```
$ npm install --save @wesleytodd/micro-router
```

```javascript
const mr = require('@wesleytodd/micro-router')
let router = mr({
  // Provide your own path/method matching semantics
  path: (route) => (path) => {
    return route === path
  },
  method: (methods = mr.METHODS) => (method) => {
    return methods.indexOf(method) === -1
  }
})

// Handle GET /
router.get('/', (req, res) => {
  res.setHeader('content-type', 'application/json')
  res.end(JSON.stringify({ hello: 'world!' }))
})

// Handle POST or PUT to /user
router.use('/user', ['POST', 'PUT'], (req, res) => {
  // Create or edit a user...
  res.statusCode = req.method === 'post' ? 201 : 200
  res.setHeader('content-type', 'application/json')
  res.end(JSON.stringify({ status: 'User Created' }))
})

// If an error occurs, this is called
router.error((err, req, res) => {
  res.statusCode = 500
  res.setHeader('content-type', 'text/plain')
  res.end(err.message)
})

http.createServer(router).listen(8080, () => {
  console.log(`http://127.0.0.1:8080`)
})
```
