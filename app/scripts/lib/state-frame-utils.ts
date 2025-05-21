import { v4 } from 'uuid';
import { Json } from '@metamask/utils';

export const CHUNK_SIZE = 8 * 1024 * 1024; // 8 MB (< any browser cap)

/** Any payload fragment traveling through runtime.Port */
export type ChunkFrame = {
  id: string;
  seq: number;
  total: number;
  data: string;
  store?: string;
};

export const isChunkFrame = (x: unknown): x is ChunkFrame =>
  Boolean(x) &&
  typeof x === 'object' &&
  'seq' in x &&
  'total' in x &&
  'data' in x;

/**
 * Converts a JSON object into a generator of chunk frames.
 *
 * @param payload - the payload to be chunked
 * @yields - a chunk frame or the original payload if it fits within a single frame
 */
export function* toFrames<T extends Json>(
  payload: T,
): Generator<ChunkFrame | T> {
  const stringifiedPayload = JSON.stringify(payload);
  const payloadLength = stringifiedPayload.length;

  const total = Math.ceil(payloadLength / CHUNK_SIZE);
  if (total === 1) {
    // no need to chunk if it fits within a single frame
    yield payload;
  }

  const id = v4();

  for (let seq = 0; seq < total; seq++) {
    const start = seq * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, payloadLength);
    const data = stringifiedPayload.slice(start, end);
    yield {
      id,
      seq,
      total,
      data,
    };
  }
}
