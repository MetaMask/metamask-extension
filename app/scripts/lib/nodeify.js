const promiseToCallback = require('promise-to-callback')
const noop = function () {}

/**
 * A generator that returns a function which, when passed a promise, can treat that promise as a node style callback.
 * The prime advantage being that callbacks are better for error handling.
 *
 * @param {Function} fn The function to handle as a callback
 * @param {Object} context The context in which the fn is to be called, most often a this reference
 *
 */
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
