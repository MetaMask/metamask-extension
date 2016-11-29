module.exports = function (promiseFn) {
  return function () {
    var args = []
    for (var i = 0; i < arguments.length - 1; i++) {
      args.push(arguments[i])
    }
    var cb = arguments[arguments.length - 1]

    const nodeified = promiseFn.apply(this, args)

    if (!nodeified) {
      const methodName = String(promiseFn).split('(')[0]
      throw new Error(`The ${methodName} did not return a Promise, but was nodeified.`)
    }
    nodeified.then(function (result) {
      cb(null, result)
    })
    .catch(function (reason) {
      cb(reason)
    })

    return nodeified
  }
}
