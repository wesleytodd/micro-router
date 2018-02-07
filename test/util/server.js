'use strict'
const http = require('http')

module.exports = function (handler, cb) {
  var server = http.createServer(handler)

  server.on('error', function (err) {
    console.error(err)
    process.exit(1)
  })

  server.listen(0, function () {
    cb(server)
  })
}
