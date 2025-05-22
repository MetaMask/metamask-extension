import { Json } from '@metamask/utils';
import createRandomId from '../../../shared/modules/random-id';

export const CHUNK_SIZE = 8 * 1024 * 1024; // 8 MB (< any browser cap)

/** Any payload fragment traveling through runtime.Port */
type id = number;
type seq = number;
type total = number;
type data = string;
export type ChunkFrame = `${id}|${total}|${seq}|${data}`;

export const isChunkFrame = (x: unknown): x is ChunkFrame =>
  typeof x === 'string';

/**
 * Converts a JSON object into a generator of chunk frames.
 *
 * @param payload - the payload to be chunked
 * @yields - a chunk frame or the original payload if it fits within a single frame
 */
export function* toFrames<T extends Json>(
  payload: T,
): Generator<ChunkFrame | T, void> {
  const json = JSON.stringify(payload);
  const len = json.length;
  const size = CHUNK_SIZE;
  const total = Math.ceil(len / size);

  if (total === 1) {
    // no need to chunk if it fits within a single frame
    yield payload;
    return;
  }

  // a cheap unique ID for the chunk
  const id = createRandomId();
  const header = `${id}|${total}` as const;
  // eslint-disable-next-line no-restricted-syntax
  for (let pos = 0, seq = 0; pos < len; pos += size, seq++) {
    const data = json.substring(pos, pos + size);
    yield `${header}|${seq}|${data}`;
  }
}
