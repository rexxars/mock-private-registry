var fs = require('fs')
var path = require('path')
var http = require('http')
var crypto = require('crypto')
var assign = require('object-assign')
var responseTemplate = require('./responseTemplate.json')

module.exports = function (opts, cb) {
  var callback = typeof opts === 'function' ? opts : cb
  var options = typeof opts === 'function' ? {} : opts

  var debug = opts.debug || false
  var pkgName = options.pkgName || '@mockscope/foobar'
  var moduleName = pkgName.split('/', 2)[1]
  var tarballPath = options.tarballPath || path.join(__dirname, 'mock.tgz')
  var tarballShaSum = sha1(fs.readFileSync(tarballPath, {encoding: null}))
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
    var correctTokenType = authToken[0] === tokenType
    var correctToken = authToken[1] === token
    if (!correctTokenType || !correctToken) {
      res.statusCode = 403
      res.setHeader('Content-Type', 'application/json')
      var message = 'Incorrect or missing token'
      if (debug) {
        message += correctTokenType ? '' : '\nExpected token type "' + tokenType + '", got "' + authToken[0] + '"'
        message += correctToken ? '' : '\nExpected token "' + token + '", got "' + authToken[1] + '"'
      }
      res.end(JSON.stringify({error: message}))
      return
    }

    if (req.url === '/' + softEncode(pkgName)) {
      res.statusCode = 200
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(generatePackageResponse()))
      return
    }

    if (req.url === '/' + pkgName + '/-/' + moduleName + '-1.0.0.tgz') {
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

  function generatePackageResponse() {
    var tpl = assign({}, responseTemplate, {
      _id: pkgName,
      name: pkgName,
    })

    tpl.versions['1.0.0'] = assign({}, tpl.versions['1.0.0'], {
      _id: pkgName + '@1.0.0',
      name: pkgName,
      dist: assign({}, tpl.versions['1.0.0'].dist, {
        shasum: tarballShaSum,
        tarball: [
          'http://' + hostname + ':' + port,
          pkgName, '-', moduleName + '-1.0.0.tgz'
        ].join('/')
      })
    })

    return tpl
  }
}

function softEncode(pkg) {
  return encodeURIComponent(pkg).replace(/^%40/, '@')
}

function sha1(data) {
  return crypto.createHash('sha1').update(data).digest('hex')
}
