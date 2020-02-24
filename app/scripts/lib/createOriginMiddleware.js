<<<<<<< HEAD
module.exports = createOriginMiddleware
=======

export default createOriginMiddleware
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc

/**
 * Returns a middleware that appends the DApp origin to request
 * @param {{ origin: string }} opts - The middleware options
 * @returns {Function}
 */
function createOriginMiddleware (opts) {
  return function originMiddleware (/** @type {any} */ req, /** @type {any} */ _, /** @type {Function} */ next) {
    req.origin = opts.origin
    next()
  }
}
