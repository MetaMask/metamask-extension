import type { JsonRpcId, JsonRpcMiddleware } from 'json-rpc-engine';
import log from 'loglevel';

/**
 * Returns a middleware that filters out requests already seen
 *
 * @returns
 */
export default function createDupeReqFilterMiddleware(): JsonRpcMiddleware<
  unknown,
  void
> {
  const processedRequestId: JsonRpcId[] = [];
  return function filterDuplicateRequestMiddleware(req, _res, next, end) {
    if (processedRequestId.indexOf(req.id) >= 0) {
      log.info(`RPC request with id ${req.id} already seen.`);
      return end();
    }
    processedRequestId.push(req.id);
    return next();
  };
}
