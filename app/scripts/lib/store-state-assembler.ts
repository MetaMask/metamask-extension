/* ──────────────────────────────────────────────────────────────────────────
 *  StoreStateAssembler  (UI side, optional helper)
 * ─────────────────────────────────────────────────────────────────────── */

import { isPerStoreChunkFrame } from './state-frame-utils';
import type { ChunkFrame } from './state-frame-utils';
import { concat } from './state-frame-utils';

export class StoreStateAssembler {
  private readonly buf = new Map<
    string,
    { parts: Uint8Array[]; total: number }
  >();

  constructor(readable: ReadableStream<unknown>) {
    (async () => {
      const rdr = readable.getReader();
      for (;;) {
        const { value, done } = await rdr.read();
        if (done) break;
        if (isPerStoreChunkFrame(value)) this.handle(value);
      }
    })().catch(console.error);
  }

  private handle(frame: ChunkFrame & { store: string }) {
    const { store, seq, total, data } = frame;
    const entry = this.buf.get(store) ?? { parts: new Array(total), total };
    entry.parts[seq] = new Uint8Array(data);
    this.buf.set(store, entry);

    if (entry.parts.filter(Boolean).length === total) {
      const merged = concat(entry.parts);
      const state = JSON.parse(new TextDecoder().decode(merged));
      this.buf.delete(store);
    }
  }
}
