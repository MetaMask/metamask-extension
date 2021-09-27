import promiseToCallback from 'promise-to-callback';

const callbackNoop = function (err) {
  if (err) {
    throw err;
  }
};

/**
 * A generator that returns a function which, when passed a promise, can treat that promise as a node style callback.
 * The prime advantage being that callbacks are better for error handling.
 *
 * @param {Function} fn - The function to handle as a callback.
 * @param {Object} context - The context in which the function is to be called,
 * most often a `this` reference.
 *
 */
export function nodeify(fn, context) {
  return function (...args) {
    const lastArg = args[args.length - 1];
    const lastArgIsCallback = typeof lastArg === 'function';
    let callback;
    if (lastArgIsCallback) {
      callback = lastArg;
      args.pop();
    } else {
      callback = callbackNoop;
    }
    // call the provided function and ensure result is a promise
    let result;
    try {
      result = Promise.resolve(fn.apply(context, args));
    } catch (err) {
      result = Promise.reject(err);
    }
    // wire up promise resolution to callback
    promiseToCallback(result)(callback);
  };
}

/**
 * Returns a new object where every function property is nodeified, and every
 * non-function property is unmodified.
 *
 * @param {Record<string, unknown>} obj - The object whose function values to
 * `nodeify`.
 * @param {Object} context - The context in which the function is to be called.
 */
export function nodeifyObject(obj, context) {
  return Object.entries(obj).reduce((nodeified, [key, value]) => {
    nodeified[key] =
      typeof value === 'function' ? nodeify(value, context) : value;
    return nodeified;
  }, {});
}
