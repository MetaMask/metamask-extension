import log from 'loglevel';

/**
 * Returns a middleware that filters out requests already seen
 *
 * @returns {Function}
 */
export default function createDupReqFilterMiddleware() {
  const processedRequestId = [];
  return function filterDuplicateRequestMiddleware(
    /** @type {any} */ req,
    /** @type {any} */ _,
    /** @type {Function} */ next,
    /** @type {Function} */ end,
  ) {
    if (processedRequestId.indexOf(req.id) >= 0) {
      log.info(`RPC request with id ${req.id} already seen.`);
      return end();
    }
    processedRequestId.push(req.id);
    return next();
  };
}
