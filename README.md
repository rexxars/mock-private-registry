# mock-private-registry

[![npm version](http://img.shields.io/npm/v/mock-private-registry.svg?style=flat-square)](http://browsenpm.org/package/mock-private-registry)[![Build Status](http://img.shields.io/travis/rexxars/mock-private-registry/master.svg?style=flat-square)](https://travis-ci.org/rexxars/mock-private-registry)

Mock of a private npm registry, useful for testing npm-related stuff

## Installation

```
npm install --save-dev mock-private-registry
```

## Usage

```js
var registry = require('mock-private-registry')
var got = require('got')

var token = 'MySecretToken'

registry({port: 18888, token: token}, function (err, server) {
  if (err) {
    throw err
  }

  var opts = {headers: {Authorization: 'Bearer ' + token}, json: true}
  got('http://localhost:18888/@mockscope%2Ffoobar', opts)
    .then(function (res) {
      console.log('Package manifest: ', res.body)
    })
    .catch(function (err) {
      console.error(err)
    })
    .then(function () {
      server.close()
    })
})
```

Basically, call the module to spin up a server, and specify whatever you want to use as the valid authorization token. Second argument is a callback, which provides access to the server that is listening. This allows you to call `close()` on it when you're done.

## Promise API

There is an alternative promise API available if you require `mock-private-registry/promise`. Usage is the same except there is no callback. Instead, the function will return a promise.

## Exposed endpoints

* `/@mockscope%2Ffoobar` - Provides a mock registry response for the fictional `@mockscope/foobar` module.
* `/@mockscope/foobar/-/foobar-1.0.0.tgz` - Provides a tarball of the fictional module.

## Why

For testing. Lots of stuff interacts with the NPM registry, but often has bugs when authorizing against private registries. Trying to mock the whole private registry flow can be difficult, so I created this.

## License

MIT-licensed. See LICENSE.
