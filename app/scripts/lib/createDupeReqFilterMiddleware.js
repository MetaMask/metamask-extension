import log from 'loglevel';

/**
 * Returns a middleware that filters out requests already seen
 *
 * @returns {Function}
 */
export default function createDupeReqFilterMiddleware() {
  const processedRequestId = [];
  return function filterDuplicateRequestMiddleware(
    /** @type {any} */ req,
    /** @type {any} */ _res,
    /** @type {Function} */ next,
  ) {
    if (processedRequestId.indexOf(req.id) >= 0) {
      log.info(`RPC request with id ${req.id} already seen.`);
      return; // Add this return statement
    }
    processedRequestId.push(req.id);
    next();
  };
}
