import { Duplex, DuplexOptions } from 'readable-stream';
import type { Runtime } from 'webextension-polyfill';

import {
  type ChunkFrame,
  isChunkFrame,
  toFrames,
  concat,
} from './state-frame-utils';

export type Log = (data: unknown, outgoing: boolean) => void;

interface Options extends DuplexOptions {
  /** optional console/logger hook */
  log?: Log;
  /** max size for each transferable slice (default: state-frame-utils.CHUNK_SIZE) */
  chunkSize?: number;
}

export default class PortDuplexStream extends Duplex {
  private readonly _port: Runtime.Port;
  private _log: Log;
  private readonly _buffer = new Map<
    string | number,
    { parts: Uint8Array[]; total: number; bin: boolean }
  >();

  /**
   * @param port - An instance of WebExtensions Runtime.Port. See:
   * {@link https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/Port}
   * @param streamOptions - stream options passed on to Duplex stream constructor
   */
  constructor(port: Runtime.Port, streamOptions: Options = {}) {
    super({
      objectMode: true,
      ...streamOptions,
    });

    this._port = port;
    this._port.onMessage.addListener((msg: unknown) => this._onMessage(msg));
    this._port.onDisconnect.addListener(() => this.destroy());
    this._log = streamOptions.log ?? (() => null);
  }

  /**
   * Callback triggered when a message is received from
   * the remote Port associated with this Stream.
   *
   * @param msg - Payload from the onMessage listener of the port
   */
  private _onMessage(msg: ChunkFrame | unknown) {
    if (isChunkFrame(msg)) {
      const { id, seq, total, bin, data } = msg;
      const entry = this._buffer.get(id) ?? {
        parts: new Array(total),
        total,
        bin,
      };
      entry.parts[seq] = new Uint8Array(data);
      this._buffer.set(id, entry);

      if (entry.parts.filter(Boolean).length === total) {
        const merged = concat(entry.parts);
        this._buffer.delete(id);

        const value = bin
          ? merged
          : JSON.parse(new TextDecoder().decode(merged) || '{}');

        this._log(value, false);
        this.push(value);
        this.emit('data', value); // for legacy listeners
      }
      return;
    }

    // normal small message
    if (Buffer.isBuffer(msg)) {
      const data: Buffer = Buffer.from(msg);
      this._log(data, false);
      this.push(data);
    } else {
      this._log(msg, false);
      this.push(msg);
    }
  }

  /**
   * Callback triggered when the remote Port associated with this Stream
   * disconnects.
   */
  private _onDisconnect(): void {
    this.destroy();
  }

  /**
   * Explicitly sets read operations to a no-op.
   */
  _read(): void {
    return undefined;
  }

  /* ───────── Writable side (stream → browser) ──────────────────────── */
  override _write(
    chunk: unknown,
    _encoding: BufferEncoding,
    callback: (error?: Error | null) => void,
  ) {
    try {
      // If caller passed a pre‑framed ChunkFrame, emit as‑is
      if (isChunkFrame(chunk)) {
        this._port.postMessage(chunk as any);
      } else {
        // otherwise frame it automatically
        const id = (chunk as any)?.id ?? Date.now() + Math.random();
        for (const frame of toFrames(id, chunk)) {
          this._port.postMessage(frame);
        }
      }
      this._log(chunk, true);
      callback();
    } catch (err) {
      callback(
        new Error('PortDuplexStream – write failed (port may be disconnected)'),
      );
    }
  }

  /**
   * Call to set a custom logger for incoming/outgoing messages
   *
   * @param log - the logger function
   */
  _setLogger(log: Log) {
    this._log = log;
  }
}

export { PortDuplexStream };
