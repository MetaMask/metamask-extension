<<<<<<< HEAD
const promiseToCallback = require('promise-to-callback')
const callbackNoop = function (err) { if (err) throw err }
=======
import promiseToCallback from 'promise-to-callback'

const callbackNoop = function (err) {
  if (err) {
    throw err
  }
}
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc

/**
 * A generator that returns a function which, when passed a promise, can treat that promise as a node style callback.
 * The prime advantage being that callbacks are better for error handling.
 *
 * @param {Function} fn - The function to handle as a callback
 * @param {Object} context - The context in which the fn is to be called, most often a this reference
 *
 */
export default function nodeify (fn, context) {
  return function () {
    // parse arguments
    const args = [].slice.call(arguments)
    const lastArg = args[args.length - 1]
    const lastArgIsCallback = typeof lastArg === 'function'
    let callback
    if (lastArgIsCallback) {
      callback = lastArg
      args.pop()
    } else {
      callback = callbackNoop
    }
    // call the provided function and ensure result is a promise
    let result
    try {
      result = Promise.resolve(fn.apply(context, args))
    } catch (err) {
      result = Promise.reject(err)
    }
    // wire up promise resolution to callback
    promiseToCallback(result)(callback)
  }
}
