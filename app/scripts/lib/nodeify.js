const promiseToCallback = require('promise-to-callback');

module.exports = function(fn, context) {
  return function(){
    const args = [].slice.call(arguments)
    const callback = args.pop()
    promiseToCallback(fn.apply(context, args))(callback)
  }
}
