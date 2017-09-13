const promiseToCallback = require('promise-to-callback')

module.exports = function nodeify (fn, context) {
  return function () {
    const args = [].slice.call(arguments)
    const callback = args.pop()
    if (typeof callback !== 'function') throw new Error('callback is not a function')
    promiseToCallback(fn.apply(context, args))(callback)
  }
}
