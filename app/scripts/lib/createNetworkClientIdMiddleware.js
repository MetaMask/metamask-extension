/**
 * Returns a middleware that appends the DApp origin to request
 *
 * @param {{ origin: string }} opts - The middleware options
 * @returns {Function}
 */
export default function createNetworkClientIdMiddleware({
  getNetworkClientIdByOrigin,
}) {
  return function networkClientIdMiddleware(
    /** @type {any} */ req,
    /** @type {any} */ _,
    /** @type {Function} */ next,
  ) {
    const networkClientId = getNetworkClientIdByOrigin(req.origin);
    req.networkClientId = networkClientId;
    next();
  };
}
