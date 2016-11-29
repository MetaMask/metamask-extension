module.exports = function (promiseFn) {
  return function () {
    var args = []
    for (var i = 0; i < arguments.length - 1; i++) {
      args.push(arguments[i])
    }
    var cb = arguments[arguments.length - 1]

    return promiseFn.apply(this, args)
    .then(function (result) {
      cb(null, result)
    })
    .catch(function (reason) {
      cb(reason)
    })
  }
}
