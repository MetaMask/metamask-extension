/* ──────────────────────────────────────────────────────────────────────────
 *  Shared helpers: frame type, (de)chunking, per‑store generator
 * ─────────────────────────────────────────────────────────────────────── */

import { Json } from '@metamask/utils';

export const CHUNK_SIZE = 512 * 1024; // 512 KB (< any browser cap)

/** Any payload fragment traveling through runtime.Port */
export interface ChunkFrame {
  id: string | number;
  seq: number;
  total: number;
  bin: boolean; // always false in the JSON‑only path
  data: number[]; // plain numbers so Port.postMessage can serialize
  store?: string;
}

export const isChunkFrame = (x: unknown): x is ChunkFrame =>
  !!x && typeof x === 'object' && 'seq' in x && 'total' in x && 'data' in x;

/* -- concat helper ------------------------------------------------------ */
export function concat(parts: Uint8Array[]): Uint8Array {
  const len = parts.reduce((n, p) => n + p.byteLength, 0);
  const out = new Uint8Array(len);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.byteLength;
  }
  return out;
}

export function* toFrames(
  id: string | number,
  payload: Json, // ← no “name” requirement
): Generator<ChunkFrame> {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  const len = bytes.byteLength;
  if (len === 0) return; // nothing to send

  const total = Math.ceil(len / CHUNK_SIZE);
  for (let seq = 0; seq < total; seq++) {
    const start = seq * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, len);
    yield {
      id,
      seq,
      total,
      bin: false,
      data: Array.from(bytes.subarray(start, end)),
    };
  }
}

/* -- per‑store state streamer (background side) ------------------------ */
export function* getBinaryStateFrames(
  this: { config: Record<string, { getState?: () => any; state?: any }> },
  config: Record<string, { getState?: () => any; state?: any }>,
  id: string | number,
): Generator<ChunkFrame> {
  throw new Error("this isn't used yet");
  for (const controller of Object.keys(this.config)) {
    const store = config[controller];
    const obj =
      typeof store.getState === 'function' ? store.getState() : store.state;

    const bytes = new TextEncoder().encode(JSON.stringify(obj));
    const len = bytes.byteLength;
    if (len === 0) continue;
    const total = Math.ceil(len / CHUNK_SIZE);

    for (let seq = 0; seq < total; seq++) {
      const slice = bytes.subarray(
        seq * CHUNK_SIZE,
        Math.min((seq + 1) * CHUNK_SIZE, bytes.byteLength),
      );
      yield {
        id,
        seq,
        total,
        bin: false,
        data: Array.from(slice),
        store: controller,
      };
    }
  }
}

export const toUint8 = (data: any): Uint8Array =>
  data instanceof ArrayBuffer ? new Uint8Array(data) : Uint8Array.from(data);
