import { JsonRpcMiddleware } from 'json-rpc-engine';
import log from 'loglevel';
import { MINUTE } from '../../../shared/constants/time';

export const THREE_MINUTES = MINUTE * 3;

/**
 * Creates a set abstraction whose values expire after three minutes.
 *
 * @returns The expiry set.
 */
const makeExpirySet = () => {
  const map: Map<string | number, number> = new Map();

  setInterval(() => {
    const cutoffTime = Date.now() - THREE_MINUTES;

    for (const [id, timestamp] of map.entries()) {
      if (timestamp <= cutoffTime) {
        map.delete(id);
      } else {
        break;
      }
    }
  }, THREE_MINUTES);

  return {
    /**
     * Attempts to add a value to the set.
     *
     * @param value - The value to add.
     * @returns `true` if the value was added, and `false` if it already existed.
     */
    add(value: string | number) {
      if (!map.has(value)) {
        map.set(value, Date.now());
        return true;
      }
      return false;
    },
  };
};

/**
 * Returns a middleware that filters out requests whose ids we've already seen.
 * Ignores JSON-RPC notifications, i.e. requests with an `undefined` id.
 *
 * @returns The middleware function.
 */
export default function createDupeReqFilterMiddleware(): JsonRpcMiddleware<
  unknown,
  void
> {
  const seenRequestIds = makeExpirySet();
  return function filterDuplicateRequestMiddleware(req, _res, next, end) {
    if (req.id === undefined) {
      // JSON-RPC notifications have no ids; our only recourse is to let them through.
      return next();
    } else if (!seenRequestIds.add(req.id)) {
      log.info(`RPC request with id "${req.id}" already seen.`);
      return end();
    }
    return next();
  };
}
