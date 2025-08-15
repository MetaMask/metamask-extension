/* eslint-disable no-plusplus, no-bitwise, default-case, @metamask/design-tokens/color-no-hex */

import type { Json } from '@metamask/utils';
import { Duplex, type DuplexOptions } from 'readable-stream';
import type { Runtime } from 'webextension-polyfill';

let _randomCounter = 0 | 0;
/**
 * Creates a random ID for chunked messages. Always <= Int32 max value.
 *
 * @returns a random number that can be used as an ID
 */
function getNextId(): number {
  // increment the counter and wrap around if it exceeds Int32 max value
  _randomCounter = (_randomCounter + 1) & 0x7fffffff;
  return _randomCounter;
}

type QueuedEntry = {
  parts: string[];
  total: number;
  received: number;
};

type Id = number;
type Seq = number;
type Final = 0 | 1;
type Data = string;

export type ChunkFrame = {
  id: Id;
  seq: Seq;
  fin: Final;
  data: Data;
};

/**
 * A transport frame that represents a chunked message.
 *
 * @property id - a unique identifier for the chunked message
 * @property seq - the sequence number of this chunk
 * @property final - if this is the last packet
 * @property data - the actual data of this chunk
 */
export type TransportChunkFrame = `${Id}|${Seq}|${Final}${Data}`;

/**
 * Options for the PortStream.
 *
 * @property log - a function to log messages
 * @property debug - whether to enable debug mode
 * @property chunkSize - the size of each chunk in bytes
 */
export type Options = {
  /**
   * A function to log messages.
   *
   * @param data - the data to log
   * @param outgoing - whether the data is outgoing (true) or incoming (false)
   */
  log?: (data: unknown, outgoing: boolean) => void;

  /**
   * Whether to enable debug mode. In debug mode, the stream will log
   * incoming and outgoing messages to the console.
   * This is useful for debugging, but should be disabled in production.
   * Defaults to `false`.
   */
  debug?: boolean;

  /**
   * The size of each chunk in bytes. Set to 0 to disabled chunking.
   */
  chunkSize?: number;
} & DuplexOptions;

/**
 * The default chunk size for the stream.
 *
 * Chromium has a maximum message size of 64 MB.
 *
 * FireFox's doesn't really have a maximum limit (I've tested it up to 2 GB), but
 * it does limit the size of the strings you can send to 1 GB per string.
 *
 * So we can just send messages on FireFox without chunking.
 *
 * Chrome limit: 64 * 1024 * 1024 - 1 (64 MB - 1 byte)
 * Firefox limit: 0 (no chunking, send as is)
 */
export const CHUNK_SIZE = globalThis.navigator.userAgent
  .toLowerCase()
  .includes('firefox')
  ? 0
  : 64 * 1024 * 1024 - 1;

export const MAX_HEADER_LENGTH = 33;

const XOR_ZERO = 48 | 0; // '0'
const PIPE_XZ = 76 | 0; // '|' ^ 48

/**
 * Parses a chunk frame from a string.
 *
 * a chunk frame is in the form: `<id>|<seq>|<fin><data>`, where:
 * - `<id>` is a unique number identifier for the chunked message
 * - `<total>` is the total number of chunks in the message
 * - `<seq>` is the sequence number of this chunk (0-based)
 * - `<data>` is the actual data of this chunk
 *
 * @param input - the value to parse
 * @returns a ChunkFrame if the value is a valid chunk frame, otherwise false
 */
const maybeParseChunkFrame = (input: unknown): ChunkFrame | null => {
  if (typeof input !== 'string') {
    return null;
  }
  const { length } = input;
  // shortest legal message is: "0|0|1" (5 characters)
  if (length < 5) {
    return null;
  }

  let i = 0 | 0;

  // parse id
  let v = 0 | 0,
    digits = 0 | 0;
  for (;;) {
    if (i >= length) return null;
    const d = (input.charCodeAt(i) ^ XOR_ZERO) | 0;
    if (d > 9) {
      if (d === PIPE_XZ) break;
      else return null;
    }
    i++;
    digits++;
    v = v * 10 + d;
  }
  if (digits === 0) return null;
  const id = v;
  if (i >= length || ((input.charCodeAt(i) ^ XOR_ZERO) | 0) !== PIPE_XZ)
    return null;
  i++; // skip '|'

  // parse seq
  v = 0 | 0;
  digits = 0 | 0;
  for (;;) {
    if (i >= length) return null;
    const d = (input.charCodeAt(i) ^ XOR_ZERO) | 0;
    if (d > 9) {
      if (d === PIPE_XZ) break;
      else return null;
    }
    i++;
    digits++;
    v = v * 10 + d;
  }
  if (digits === 0) return null;
  const seq = v;
  if (i >= length || ((input.charCodeAt(i) ^ XOR_ZERO) | 0) !== PIPE_XZ)
    return null;
  i++; // skip '|'

  // parse fin
  if (i >= length) return null;
  const fin = ((input.charCodeAt(i) ^ XOR_ZERO) | 0) as Final;
  if ((fin & ~1) !== 0) return null;
  i++; // first data char

  return { id, seq, fin, data: input.slice(i) };
};

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
export function* toFrames<Payload extends Json>(
  payload: Payload,
  chunkSize: number = CHUNK_SIZE,
): Generator<TransportChunkFrame | Payload, void> {
  const json = JSON.stringify(payload);
  const payloadLength = json.length;

  if (payloadLength <= chunkSize) {
    // no need to chunk if it fits within a single frame
    yield payload;
    return;
  }

  // we need to leave space for our header
  const id = getNextId();
  for (let index = 0, seq = 0; index < payloadLength; seq++) {
    const header = `${id}|${seq}|` as const;
    const headerSize = header.length + 1; // (`+ 1` for the `fin` flag, which hasn't been computed yet)
    // how much data can we send with this specific header?
    const partialDataLength = chunkSize - headerSize;
    // compute next `pos` to determine if this is the final frame
    const data = json.substring(index, (index += partialDataLength));
    const fin = index >= payloadLength ? 1 : 0;
    const frame: TransportChunkFrame = `${header}${fin}${data}`;
    yield frame;
  }
}

const TAG = '%cPortStream';
const STYLE_IN = 'color:#0b8;'; // inbound
const STYLE_OUT = 'color:#08f;'; // outbound
const STYLE_SYS = 'color:#888;'; // system

export class PortStream extends Duplex {
  private readonly port: Runtime.Port;

  private readonly queue = new Map<Id, QueuedEntry>();

  private chunkSize: number;

  private debug = false;

  private log: (d: unknown, out: boolean) => void;

  constructor(
    port: Runtime.Port,
    { chunkSize, debug, log, ...opts }: Options = {},
  ) {
    if (chunkSize && chunkSize < MAX_HEADER_LENGTH) {
      throw new Error(
        `Cannot chunk messages smaller than the max header length, ${MAX_HEADER_LENGTH}`,
      );
    }

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
  private onMessage = (
    msg: Json | TransportChunkFrame,
    _port: Runtime.Port,
  ) => {
    if (this.debug) {
      console.debug(TAG, STYLE_IN, '← raw', msg);
    }

    if (this.chunkSize > 0) {
      const frame = maybeParseChunkFrame(msg);
      if (frame !== null) {
        this.handleChunk(frame);
        return;
      }
    }

    // handle smaller, un‑framed messages
    this.log('received unchunked message', false);
    this.push(msg);
  };

  /**
   * Handles chunked messages.
   *
   * @param chunk - the chunk frame received from the port
   */
  private handleChunk(chunk: ChunkFrame) {
    const { id, seq, fin, data } = chunk;

    if (this.debug) {
      console.debug(
        TAG,
        STYLE_IN,
        `← frame #${seq + 1}/? id=${id} (${data.length} bytes)`,
      );
    }

    let entry = this.queue.get(id);
    if (entry) {
      entry.received += 1;
    } else {
      entry = {
        parts: [],
        total: 0,
        received: 1,
      };
      this.queue.set(id, entry);
    }
    if (fin === 1) {
      entry.total = seq + 1;
    }
    entry.parts[seq] = data;

    if (entry.received === entry.total) {
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

      this.log('received chunked message', false);
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

  /**
   * Safely invokes a callback by scheduling it in the microtask queue.
   * This prevents reentrancy issues where the callback might throw an exception
   * and cause the calling code to execute the callback again before returning.
   *
   * @param callback
   * @param error
   */
  private safeCallback(
    callback: (err?: Error | null) => void,
    error?: Error | null,
  ) {
    queueMicrotask(() => callback(error));
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
   * @param chunk - the chunk to write.
   * @param encoding - encoding (must be UTF-8)
   * @param callback - callback to call when done
   */
  override _write(
    chunk: Json,
    encoding: BufferEncoding,
    callback: (err?: Error | null) => void,
  ) {
    if (encoding && encoding !== 'utf8' && encoding !== 'utf-8') {
      this.safeCallback(
        callback,
        new Error('PortStream only supports UTF-8 encoding'),
      );
      return;
    }

    try {
      // try to send the chunk as is first, it is probably fine!
      this.postMessage(chunk);
      if (this.debug) {
        console.debug(TAG, STYLE_SYS, 'sent whole chunk via postMessage');
      }
      this.log('sent payload without chunking', true);
      this.safeCallback(callback);
    } catch (err) {
      if (this.debug) {
        console.debug(
          TAG,
          STYLE_SYS,
          'could not send whole chunk via postMessage',
          err,
        );
      }
      if (err instanceof Error) {
        const { chunkSize } = this;
        if (
          // chunking is enabled
          chunkSize > 0 &&
          // and the error is about message size being too large
          // note: this message doesn't currently happen on firefox, as it doesn't
          // have a maximum message size
          err.message === 'Message length exceeded maximum allowed length'
        ) {
          try {
            // we can't just send it in one go; we need to chunk it
            for (const frame of toFrames(chunk, chunkSize)) {
              this.postMessage(frame);
            }
            this.log('sent payload with chunking', true);
            this.safeCallback(callback);
          } catch (chunkErr) {
            if (this.debug) {
              console.debug(TAG, STYLE_SYS, '⚠ write error', chunkErr);
            }
            console.error(chunkErr);
            this.safeCallback(
              callback,
              new AggregateError(
                [chunkErr],
                'PortStream chunked postMessage failed',
              ),
            );
          }
        } else {
          this.safeCallback(
            callback,
            new AggregateError([err], 'PortStream postMessage failed'),
          );
        }
      } else {
        // error is unknown.
        console.error(String(err));
        this.safeCallback(callback, new Error('PortStream postMessage failed'));
      }
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
