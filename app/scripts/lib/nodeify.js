const promiseToCallback = require('promise-to-callback')
const noop = function () {}

module.exports = function nodeify (fn, context) {
  return function () {
    const args = [].slice.call(arguments)
    const lastArg = args[args.length - 1]
    const lastArgIsCallback = typeof lastArg === 'function'
    let callback
    if (lastArgIsCallback) {
      callback = lastArg
      args.pop()
    } else {
      callback = noop
    }
    promiseToCallback(fn.apply(context, args))(callback)
  }
}
