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
    /** @type {Function} */ end,
  ) {
    console.log(
      '!@# processedRequestId A:',
      processedRequestId,
      '|->',
      Date.now(),
    );
    console.log('!@# req', JSON.stringify(req));
    if (processedRequestId.indexOf(req.id) >= 0) {
      console.log(
        '!@# createDupeReqFilterMiddleware duplicate!',
        '|->',
        Date.now(),
      );
      log.info(`RPC request with id ${req.id} already seen.`);
      return end();
    }
    processedRequestId.push(req.id);
    console.log(
      '!@# processedRequestId B:',
      processedRequestId,
      '|->',
      Date.now(),
    );
    return next();
  };
}
