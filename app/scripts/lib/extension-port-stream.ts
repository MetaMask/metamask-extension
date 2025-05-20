import type { Json } from '@metamask/utils';
import { Duplex, DuplexOptions } from 'readable-stream';
import type { Runtime } from 'webextension-polyfill';
import {
  ChunkFrame,
  isChunkFrame,
  toFrames,
  concat,
  toUint8,
} from './state-frame-utils';
import { v4 as uuidv4 } from 'uuid';

export interface Options extends DuplexOptions {
  log?: (data: unknown, outgoing: boolean) => void;
  debug?: boolean; // 🆕
}

const TAG = '%cPortStream';
const STYLE_IN = 'color:#0b8;'; // inbound
const STYLE_OUT = 'color:#08f;'; // outbound
const STYLE_SYS = 'color:#888;'; // system

export default class PortDuplexStream extends Duplex {
  private readonly port: Runtime.Port;
  private readonly buffer = new Map<
    string | number,
    { parts: Uint8Array[]; total: number; bin: boolean }
  >();
  private log: (d: unknown, out: boolean) => void;
  private debug = false;

  constructor(port: Runtime.Port, opts: Options = {}) {
    super({ objectMode: true, ...opts });

    this.port = port;
    // default to false
    this.debug = !!opts.debug;
    this.log = opts.log ?? (() => undefined);

    port.onMessage.addListener((msg) => this.onMessage(msg));
    port.onDisconnect.addListener(() => this.onDisconnect());

    if (this.debug) {
      console.debug(TAG, STYLE_SYS, '🛠  debug mode ON');
    }
  }

  /* ------------------------------------------------------------------ */
  /*                     Duplex Read side (inbound)                     */
  /* ------------------------------------------------------------------ */

  private onMessage(msg: unknown) {
    if (this.debug) {
      console.debug(TAG, STYLE_IN, '← raw', msg);
    }

    if (isChunkFrame(msg)) {
      this.handleChunk(msg);
      return;
    }

    // small un‑framed message
    this.log(msg, false);
    this.push(msg);
    this.emit('message', msg);
  }

  private handleChunk(frame: ChunkFrame) {
    const { id, seq, total, bin, data } = frame;

    if (this.debug) {
      console.debug(
        TAG,
        STYLE_IN,
        `← frame #${seq + 1}/${total} id=${id} (${data.length} bytes)`,
      );
    }

    const entry = this.buffer.get(id) ?? {
      parts: new Array(total),
      total,
      bin,
    };
    entry.parts[seq] = toUint8(data);
    this.buffer.set(id, entry);

    if (entry.parts.filter(Boolean).length === total) {
      const merged = concat(entry.parts);
      this.buffer.delete(id);

      const txt = new TextDecoder().decode(merged);
      const value = bin ? merged : txt ? JSON.parse(txt) : '';

      if (this.debug) {
        console.debug(
          TAG,
          STYLE_IN,
          `✔ re‑assembled id=${id} (${merged.byteLength} bytes)`,
        );
      }

      this.log(value, false);
      this.push(value);
      this.emit('message', value);
    }
  }

  private onDisconnect() {
    if (this.debug) console.debug(TAG, STYLE_SYS, '✖ port disconnected');
    this.destroy();
  }

  _read() {
    /* no‑op – push happens in onMessage */
  }

  /* ------------------------------------------------------------------ */
  /*                    Duplex Write side (outbound)                    */
  /* ------------------------------------------------------------------ */

  override _write(
    chunk: ChunkFrame | Json,
    _enc: BufferEncoding,
    cb: (err?: Error | null) => void,
  ) {
    const send = (obj: unknown) => {
      if (this.debug) console.debug(TAG, STYLE_OUT, '→', obj);
      this.port.postMessage(obj as any);
    };

    try {
      if (isChunkFrame(chunk)) {
        send(chunk);
      } else {
        const id = uuidv4();
        for (const frame of toFrames(id, chunk as Json)) send(frame);
      }
      this.log(chunk, true);
      cb();
    } catch (err) {
      if (this.debug) console.debug(TAG, STYLE_SYS, '⚠ write error', err);
      cb(new Error('PortStream write failed'));
    }
  }

  /* ------------------------------------------------------------------ */
  /*                         Utility helpers                            */
  /* ------------------------------------------------------------------ */

  /** swap logger at runtime */
  setLogger(fn: (d: unknown, out: boolean) => void) {
    this.log = fn;
  }
}

export { PortDuplexStream };
