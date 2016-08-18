var mock = require('./index')

module.exports = function (opts) {
  return new Promise((resolve, reject) => {
    mock(opts || {}, function (err, server) {
      if (err) {
        reject(err)
      } else {
        resolve(server)
      }
    })
  })
}
