import type { Json } from '@metamask/utils';
import { Duplex, DuplexOptions } from 'readable-stream';
import type { Runtime } from 'webextension-polyfill';
import createRandomId from '../../../shared/modules/random-id';

type BufferEntry = {
  parts: string[];
  total: number;
  received: number;
};

type id = number; // Reverted back to number
type seq = number;
type total = number;
type data = string;

export type ChunkFrame = `${id}|${total}|${seq}|${data}`;

export type Options = {
  log?: (data: unknown, outgoing: boolean) => void;
  debug?: boolean;
  /**
   * The size of each chunk in bytes. Set to 0 to disabled chunking.
   */
  chunkSize?: number;
} & DuplexOptions;

export const CHUNK_SIZE = 8 * 1024 * 1024; // 8 MB (< any browser cap)

export const isChunkFrame = (x: unknown): x is ChunkFrame =>
  typeof x === 'string';

/**
 * Converts a JSON object into a generator of chunk frames.
 *
 * @param payload - the payload to be chunked
 * @param chunkSize - the size of each chunk in bytes. If `0`, returns the
 * payload as is. If the given `chunkSize` will result in a single frame, the
 * payload is returned as is.
 * @yields - a chunk frame or the original payload if it fits within a single
 * frame
 */
export function* toFrames<T extends Json>(
  payload: T,
  chunkSize: number = CHUNK_SIZE,
): Generator<ChunkFrame | T, void> {
  if (chunkSize <= 0) {
    yield payload;
    return;
  }

  const json = JSON.stringify(payload);
  const len = json.length;
  const total = Math.ceil(len / chunkSize);

  if (total === 1) {
    // no need to chunk if it fits within a single frame
    yield payload;
    return;
  }

  const id = createRandomId();
  const header = `${id}|${total}` as const;
  // eslint-disable-next-line no-restricted-syntax
  for (let pos = 0, seq = 0; pos < len; pos += chunkSize, seq++) {
    const data = json.substring(pos, pos + chunkSize);
    yield `${header}|${seq}|${data}`;
  }
}

const TAG = '%cPortStream';
const STYLE_IN = 'color:#0b8;'; // inbound
const STYLE_OUT = 'color:#08f;'; // outbound
const STYLE_SYS = 'color:#888;'; // system

export class PortStream extends Duplex {
  private readonly port: Runtime.Port;

  private readonly queue = new Map<string, BufferEntry>();

  private chunkSize: number;

  private debug = false;

  private log: (d: unknown, out: boolean) => void;

  constructor(
    port: Runtime.Port,
    { chunkSize, debug, log, ...opts }: Options = {},
  ) {
    super({ objectMode: true, highWaterMark: 256, ...opts });

    this.port = port;

    this.chunkSize = chunkSize ?? CHUNK_SIZE;
    this.debug = Boolean(debug);
    this.log = log ?? (() => undefined);

    port.onMessage.addListener(this.onMessage);
    port.onDisconnect.addListener(this.onDisconnect);

    if (this.debug) {
      console.debug(TAG, STYLE_SYS, '🛠  debug mode ON');
    }
  }

  /**
   * Handles incoming messages from the port.
   *
   * @param msg - the message received from the port
   * @param _port - the port that sent the message
   */
  private onMessage = (msg: Json | ChunkFrame, _port: Runtime.Port) => {
    if (this.debug) {
      console.debug(TAG, STYLE_IN, '← raw', msg);
    }

    if (this.chunkSize > 0 && isChunkFrame(msg)) {
      this.handleChunk(msg);
    } else {
      // handle smaller, un‑framed messages
      this.log(msg, false);
      this.push(msg);
    }
  };

  /**
   * Handles chunked messages.
   *
   * @param chunk - the chunk frame received from the port
   */
  private handleChunk(chunk: string) {
    const [id, totalStr, seqStr, data] = chunk.split('|', 4);
    const total = parseInt(totalStr, 10);
    const seq = parseInt(seqStr, 10);

    if (this.debug) {
      console.debug(
        TAG,
        STYLE_IN,
        `← frame #${seq + 1}/${total} id=${id} (${data.length} bytes)`,
      );
    }

    let entry = this.queue.get(id);
    if (entry) {
      entry.received += 1;
    } else {
      entry = {
        parts: new Array(total),
        total,
        received: 1,
      };
      this.queue.set(id, entry);
    }
    entry.parts[seq] = data;

    if (entry.received === total) {
      this.queue.delete(id);

      const merged = entry.parts.join('');
      const value = JSON.parse(merged);

      if (this.debug) {
        console.debug(
          TAG,
          STYLE_IN,
          `✔ re-assembled id=${id} (${merged.length} bytes)`,
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
  private onDisconnect = (_port: Runtime.Port) => {
    if (this.debug) {
      console.debug(TAG, STYLE_SYS, '✖ port disconnected');
    }
    // clean up, as we aren't going to receive any more messages
    this.queue.clear();
    this.destroy(new Error('Port disconnected'));
  };

  /**
   * No-op, push happens in onMessage.
   */
  override _read() {
    // No-op, push happens in onMessage.
  }

  private postMessage(obj: unknown) {
    if (this.debug) {
      console.debug(TAG, STYLE_OUT, '→', obj);
    }
    this.port.postMessage(obj);
  }

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

    try {
      const { chunkSize } = this;
      // if the frame is already chunked, send it as is
      if (chunkSize > 0 && isChunkFrame(chunk)) {
        this.postMessage(chunk);
      } else {
        // chunk it ourselves
        for (const frame of toFrames(chunk, chunkSize)) {
          this.postMessage(frame);
        }
      }
      this.log(chunk, true);
      callback();
    } catch (err) {
      if (this.debug) {
        console.debug(TAG, STYLE_SYS, '⚠ write error', err);
      }
      console.error(err);
      callback(new AggregateError([err], 'PortStream write failed'));
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
