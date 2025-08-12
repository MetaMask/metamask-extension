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
type Total = number;
type Data = string;

export type ChunkFrame = {
  id: Id;
  total: Total;
  seq: Seq;
  data: Data;
};

/**
 * A transport frame that represents a chunked message.
 *
 * @property id - a unique identifier for the chunked message
 * @property total - the total number of chunks in the message
 * @property seq - the sequence number of this chunk
 * @property data - the actual data of this chunk
 */
export type TransportChunkFrame = `${Id}|${Total}|${Seq}|${Data}`;

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

enum S {
  Id,
  Total,
  Seq,
  Data,
}

/**
 * Parses a chunk frame from a string.
 *
 * a chunk frame is in the form: `<id>|<total>|<seq>|<data>`, where:
 * - `<id>` is a unique number identifier for the chunked message
 * - `<total>` is the total number of chunks in the message
 * - `<seq>` is the sequence number of this chunk (0-based)
 * - `<data>` is the actual data of this chunk
 *
 * @param input - the value to parse
 * @returns a ChunkFrame if the value is a valid chunk frame, otherwise false
 */
const maybeParseChunkFrame = (input: unknown): ChunkFrame | false => {
  if (typeof input !== 'string') {
    return false;
  }
  const { length } = input;
  // shortest legal message is: "0|1|0|" (6 characters)
  if (length < 6) {
    return false;
  }

  let state = S.Id;
  let value = 0;
  let hasDigit = false;

  let id = 0;
  let total = 0;
  let seq = 0;

  for (let i = 0; i < length; ++i) {
    if (state === S.Data) {
      // first byte of data → grab remainder and exit
      return { id, total, seq, data: input.slice(i) };
    }

    const cc = input.charCodeAt(i);
    if (cc >= 48 && cc <= 57) {
      // '0'..'9'
      const digit = cc ^ 48; // character "0" is actually `0`
      value = ((value << 3) + (value << 1) + digit) | 0;
      hasDigit = true;
      continue;
    }
    if (cc === 124) {
      // '|'
      if (!hasDigit) {
        // we didn't find any digits before a delimiter, so this is invalid
        return false;
      }
      switch (state) {
        case S.Id:
          id = value;
          break;
        case S.Total:
          total = value;
          break;
        case S.Seq:
          seq = value;
          break;
      }
      state++;
      value = 0;
      hasDigit = false;
      continue;
    }

    // invalid character
    return false;
  }

  // must have ended in Data state (allows empty data)
  return state === S.Data ? { id, total, seq, data: '' } : false;
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
  const len = json.length;
  const total = Math.ceil(len / chunkSize);

  if (total === 1) {
    // no need to chunk if it fits within a single frame
    yield payload;
    return;
  }

  const id = getNextId();
  const header = `${id}|${total}` as const;
  // eslint-disable-next-line no-restricted-syntax
  for (let pos = 0, seq = 0; pos < len; pos += chunkSize, seq++) {
    const data = json.substring(pos, pos + chunkSize);
    const frame: TransportChunkFrame = `${header}|${seq}|${data}`;
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
      if (frame !== false) {
        this.handleChunk(frame);
        return;
      }
    }

    // handle smaller, un‑framed messages
    this.log(msg, false);
    this.push(msg);
  };

  /**
   * Handles chunked messages.
   *
   * @param chunk - the chunk frame received from the port
   */
  private handleChunk(chunk: ChunkFrame) {
    const { id, total, seq, data } = chunk;

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
      callback(new Error('PortStream only supports UTF-8 encoding'));
      return;
    }

    try {
      // try to send the chunk as is first, it is probably fine!
      this.postMessage(chunk);
    } catch (err) {
      if (err instanceof Error) {
        const { chunkSize } = this;
        if (
          // checking is enabled
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
            this.log(chunk, true);
            callback();
          } catch (chunkErr) {
            if (this.debug) {
              console.debug(TAG, STYLE_SYS, '⚠ write error', chunkErr);
            }
            console.error(chunkErr);
            callback(
              new AggregateError(
                [chunkErr],
                'PortStream chunked postMessage failed',
              ),
            );
          }
        } else {
          callback(new AggregateError([err], 'PortStream postMessage failed'));
        }
      } else {
        // error is unknown.
        console.error(String(err));
        callback(new Error('PortStream postMessage failed'));
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
