var fs = require('fs')
var path = require('path')
var http = require('http')
var responseTemplate = require('./responseTemplate.json')

var tarballPath = path.join(__dirname, 'mock.tgz')

module.exports = function (opts, cb) {
  var callback = typeof opts === 'function' ? opts : cb
  var options = typeof opts === 'function' ? {} : opts

  var hostname = options.hostname || '127.0.0.1'
  var port = options.port || 63142
  var token = options.token || 'MySecretToken'
  var tokenType = options.tokenType || 'Bearer'

  var server = http.createServer(function (req, res) {
    if (req.method !== 'GET') {
      res.statusCode = 405
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({error: 'Method Not Allowed'}))
      return
    }

    var authToken = (req.headers.authorization || '').split(' ', 2)
    if (authToken[0] !== tokenType || authToken[1] !== token) {
      res.statusCode = 403
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({error: 'Incorrect or missing token'}))
      return
    }

    if (req.url === '/@mockscope%2Ffoobar') {
      res.statusCode = 200
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(generatePackageResponse(hostname, port)))
      return
    }

    if (req.url === '/@mockscope/foobar/-/foobar-1.0.0.tgz') {
      res.statusCode = 200
      res.setHeader('Content-Type', 'application/octet-stream')
      fs.createReadStream(tarballPath).pipe(res)
      return
    }

    res.statusCode = 404
    res.end(JSON.stringify({error: 'File Not Found'}))
  })

  server.listen(port, hostname, function () {
    callback(null, server)
  })
}

function generatePackageResponse(hostname, port) {
  var tpl = Object.assign({}, responseTemplate)
  tpl.versions['1.0.0'].dist = Object.assign({}, tpl.versions['1.0.0'].dist, {
    tarball: 'http://' + hostname + ':' + port + '/@mockscope/foobar/-/foobar-1.0.0.tgz'
  })
  return tpl
}
