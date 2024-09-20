import { Transform } from 'readable-stream';
import log from 'loglevel';
import type { JsonRpcRequest } from '@metamask/utils';
import { MINUTE } from '../../../shared/constants/time';

export const THREE_MINUTES = MINUTE * 3;

/**
 * Creates a set abstraction whose values expire after three minutes.
 *
 * @returns The expiry set.
 */
const makeExpirySet = () => {
  const map: Map<string | number | null, number> = new Map();

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
    add(value: string | number | null) {
      if (!map.has(value)) {
        map.set(value, Date.now());
        return true;
      }
      return false;
    },
  };
};

/**
 * Returns a transform stream that filters out requests whose ids we've already seen.
 * Ignores JSON-RPC notifications, i.e. requests with an `undefined` id.
 *
 * @returns The stream object.
 */
export default function createDupeReqFilterStream() {
  const seenRequestIds = makeExpirySet();
  return new Transform({
    transform(chunk: JsonRpcRequest, _, cb) {
      // JSON-RPC notifications have no ids; our only recourse is to let them through.
      const hasNoId = chunk.id === undefined;
      const requestNotYetSeen = seenRequestIds.add(chunk.id);

      if (hasNoId || requestNotYetSeen) {
        cb(null, chunk);
      } else {
        log.debug(`RPC request with id "${chunk.id}" already seen.`);
        cb();
      }
    },
    objectMode: true,
  });
}
