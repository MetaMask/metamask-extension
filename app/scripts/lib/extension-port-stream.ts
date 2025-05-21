import type { Json } from '@metamask/utils';
import { Duplex, DuplexOptions } from 'readable-stream';
import type { Runtime } from 'webextension-polyfill';
import { ChunkFrame, isChunkFrame, toFrames } from './state-frame-utils';

export interface Options extends DuplexOptions {
  log?: (data: unknown, outgoing: boolean) => void;
  debug?: boolean;
}

const TAG = '%cPortStream';
const STYLE_IN = 'color:#0b8;'; // inbound
const STYLE_OUT = 'color:#08f;'; // outbound
const STYLE_SYS = 'color:#888;'; // system

export default class PortDuplexStream extends Duplex {
  private readonly port: Runtime.Port;
  private readonly buffer = new Map<
    string,
    { parts: string[]; total: number }
  >();
  private log: (d: unknown, out: boolean) => void;
  private debug = false;

  constructor(port: Runtime.Port, { log, debug, ...opts }: Options = {}) {
    super({ objectMode: true, ...opts });

    this.port = port;

    this.debug = Boolean(debug);
    this.log = log ?? (() => undefined);

    port.onMessage.addListener(this.onMessage.bind(this));
    port.onDisconnect.addListener(this.onDisconnect.bind(this));

    if (this.debug) {
      console.debug(TAG, STYLE_SYS, '🛠  debug mode ON');
    }
  }

  /**
   * Handles incoming messages from the port.
   *
   * @param msg - the message received from the port
   * @param _port - the port that sent the message
   * @returns
   */
  private onMessage(msg: unknown, _port: Runtime.Port) {
    if (this.debug) {
      console.debug(TAG, STYLE_IN, '← raw', msg);
    }

    if (isChunkFrame(msg)) {
      this.handleChunk(msg);
    } else {
      // handle smaller, un‑framed messages
      this.log(msg, false);
      this.push(msg);
    }
  }

  /**
   * Handles chunked messages.
   *
   * @param frame - the chunk frame received from the port
   */
  private handleChunk({ id, seq, total, data }: ChunkFrame) {
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
    };
    entry.parts[seq] = data;
    this.buffer.set(id, entry);

    if (entry.parts.filter(Boolean).length === total) {
      this.buffer.delete(id);

      const merged = entry.parts.join('');
      const value = JSON.parse(merged);

      if (this.debug) {
        console.debug(
          TAG,
          STYLE_IN,
          `✔ re-assembled id=${id} (${value.length} bytes)`,
        );
      }

      this.log(value, false);
      this.push(value);
    }
  }

  /**
   * Cleans up the stream and buffered chunks when the port is disconnected.
   *
   * @param _port - the port that was disconnected
   */
  private onDisconnect(_port: Runtime.Port) {
    if (this.debug) console.debug(TAG, STYLE_SYS, '✖ port disconnected');
    this.destroy();
    // clean up buffer, as we aren't going to receive any more messages
    this.buffer.clear();
  }

  /**
   * No-op, push happens in onMessage.
   */
  _read() {}

  /**
   * Handles writing to the port.
   *
   * @param chunk - the chunk to write
   * @param encoding - encoding (must be UTF-8)
   * @param callback - callback to call when done
   */
  override _write(
    chunk: ChunkFrame | Json,
    encoding: BufferEncoding,
    callback: (err?: Error | null) => void,
  ) {
    if (encoding && encoding !== 'utf8' && encoding !== 'utf-8') {
      callback(new Error('PortStream only supports UTF-8 encoding'));
      return;
    }

    const send = (obj: unknown) => {
      if (this.debug) console.debug(TAG, STYLE_OUT, '→', obj);
      this.port.postMessage(obj);
    };

    try {
      // if the frame is already chunked, send it as is
      if (isChunkFrame(chunk)) {
        send(chunk);
        this.log(chunk, true);
      } else {
        // chunk it ourselves
        const frames = toFrames(chunk);
        let next = frames.next();
        while (!next.done) {
          send(next.value);
          next = frames.next();
        }
      }
      this.log(chunk, true);
      callback();
    } catch (err) {
      if (this.debug) console.debug(TAG, STYLE_SYS, '⚠ write error', err);
      callback(new Error('PortStream write failed'));
    }
  }

  /**
   * Sets the logger function to be used for logging messages.
   *
   * @param fn - function to log messages
   */
  setLogger(fn: (d: unknown, out: boolean) => void) {
    this.log = fn;
  }
}

export { PortDuplexStream };
