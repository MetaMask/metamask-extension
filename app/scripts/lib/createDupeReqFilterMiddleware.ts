import { JsonRpcMiddleware } from 'json-rpc-engine';
import log from 'loglevel';
import { MINUTE } from '../../../shared/constants/time';

export const THREE_MINUTES = MINUTE * 3;

/**
 * Creates a set abstraction whose values expire after five minutes.
 *
 * @returns The expiry set.
 */
const makeExpirySet = () => {
  const seenValues: (number | string)[] = [];
  const timestamps: number[] = [];

  setTimeout(() => {
    if (timestamps.length === 0) {
      return;
    }

    const cutoffTime = Date.now() - THREE_MINUTES;

    if (timestamps.length === 1 && timestamps[0] <= cutoffTime) {
      seenValues.shift();
      timestamps.shift();
      return;
    }

    for (let i = 0; i < timestamps.length; i++) {
      if (timestamps[i] > cutoffTime) {
        seenValues.splice(0, i);
        timestamps.splice(0, i);
        break;
      }
    }
  }, THREE_MINUTES);

  // Implement our `has` operation as a search in descending order, under the assumption
  // that repeats are more likely to occur in short succession.
  const has = (value: string | number) => {
    return (
      seenValues.findLast((seenValue) => seenValue === value) !== undefined
    );
  };

  return {
    /**
     * Attempts to add a value to the set.
     *
     * @param value - The value to add.
     * @returns `true` if the value was added, and `false` if it already existed.
     */
    add(value: string | number) {
      if (!has(value)) {
        seenValues.push(value);
        timestamps.push(Date.now());
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
