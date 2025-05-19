/* ──────────────────────────────────────────────────────────────────────────
 *  Shared helpers: frame type, (de)chunking, per‑store generator
 * ─────────────────────────────────────────────────────────────────────── */

export const CHUNK_SIZE = 512 * 1024; // 512 KB (< any browser cap)

/** Any payload fragment travelling through runtime.Port */
export interface ChunkFrame {
  id: string | number; // JSON‑RPC request id this frame belongs to
  seq: number; // 0‑based slice index
  total: number; // slice count
  bin: boolean; // true → binary (Uint8Array), false → JSON
  data: ArrayBuffer; // ≤ CHUNK_SIZE transferable
  /** present only for per‑store streaming */
  store?: string;
}

export const isChunkFrame = (x: unknown): x is ChunkFrame =>
  !!x && typeof x === 'object' && 'seq' in x && 'total' in x && 'data' in x;

export const isPerStoreChunkFrame = (
  x: unknown,
): x is ChunkFrame & { store: string } =>
  isChunkFrame(x) &&
  'store' in x &&
  typeof (x as { store: unknown }).store === 'string';

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

/* -- general‑purpose chunker (JSON or binary) --------------------------- */
export function* toFrames(
  id: string | number,
  payload: unknown,
): Generator<ChunkFrame> {
  let bytes: Uint8Array;
  let bin = false;

  if (payload instanceof ArrayBuffer || ArrayBuffer.isView(payload)) {
    bin = true;
    bytes =
      payload instanceof ArrayBuffer
        ? new Uint8Array(payload)
        : new Uint8Array(
            payload.buffer,
            (payload as ArrayBufferView).byteOffset,
            (payload as ArrayBufferView).byteLength,
          );
  } else {
    bytes = new TextEncoder().encode(JSON.stringify(payload));
  }

  const total = Math.ceil(bytes.byteLength / CHUNK_SIZE) || 1;
  for (let seq = 0; seq < total; seq++) {
    const slice = bytes.subarray(
      seq * CHUNK_SIZE,
      Math.min((seq + 1) * CHUNK_SIZE, bytes.byteLength),
    );
    yield { id, seq, total, bin, data: slice.buffer };
  }
}

/* -- per‑store state streamer (background side) ------------------------ */
export function* getBinaryStateFrames(
  this: { config: Record<string, { getState?: () => any; state?: any }> },
  config: Record<string, { getState?: () => any; state?: any }>,
  id: string | number,
): Generator<ChunkFrame> {
  for (const controller of Object.keys(this.config)) {
    const store = config[controller];
    const obj =
      typeof store.getState === 'function' ? store.getState() : store.state;

    const bytes = new TextEncoder().encode(JSON.stringify(obj));
    const total = Math.ceil(bytes.byteLength / CHUNK_SIZE) || 1;

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
        data: slice.buffer,
        store: controller,
      };
    }
  }
}
