import log from 'loglevel';

/**
 * Returns a middleware that logs RPC activity. Logging is detailed in
 * development builds, but more limited in production builds.
 *
 * @param {{ origin: string }} opts - The middleware options
 * @returns {Function}
 */
export default function createLoggerMiddleware(opts) {
  return function loggerMiddleware(
    /** @type {any} */ req,
    /** @type {any} */ res,
    /** @type {Function} */ next,
  ) {
    next((/** @type {Function} */ cb) => {
      if (res.error) {
        // log.debug('Error in RPC response:\n', res);
      }
      if (req.isMetamaskInternal) {
        return;
      }
      // if (process.env.METAMASK_DEBUG) {
      //   log.info(`RPC (${opts.origin}):`, req, '->', res);
      // } else {
      //   log.info(
      //     `RPC (${opts.origin}): ${req.method} -> ${
      //       res.error ? 'error' : 'success'
      //     }`,
      //   );
      // }
      cb();
    });
  };
}
