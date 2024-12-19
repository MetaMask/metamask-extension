/**
 * Returns a middleware that appends the mainFrameOrigin to request
 *
 * @param {{ mainFrameOrigin: string }} opts - The middleware options
 * @returns {Function}
 */

export default function createMainFrameOriginMiddleware({ mainFrameOrigin }) {
  return function mainFrameOriginMiddleware(
    /** @type {any} */ req,
    /** @type {any} */ _,
    /** @type {Function} */ next,
  ) {
    req.mainFrameOrigin = mainFrameOrigin;
    next();
  };
}
