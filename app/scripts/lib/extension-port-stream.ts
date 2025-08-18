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

/**
 * Represents a queued chunked message.
 */
type QueuedEntry = {
  /**
   * The parts of the chunked message.
   */
  parts: [source: string, dataIndex: number][];
  /**
   * The total number of chunks in the message.
   */
  expected: number;
  /**
   * The number of chunks that have been received.
   */
  received: number;
};

type Id = number;
type Seq = number;
type Final = 0 | 1;
type Data = string;

/**
 * A parsed chunk of a {@link TransportChunkFrame} message.
 */
type ChunkFrame = {
  id: Id;
  seq: Seq;
  fin: Final;
  source: string;
  dataIndex: number;
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
 * Chrome limit: 1 << 26 (64 MB)
 * Firefox limit: 0 (no chunking, send as is)
 */
export const CHUNK_SIZE = globalThis.navigator.userAgent.includes('Firefox')
  ? 0
  : 1 << 26;

// `2147483647|2147483647|1` is 23, then add 1 because we require 1 character of
// data. `2147483647` is the max Int32 we allow for the `id`. A seq of
// 2147483647 is impossible at a realistic CHUNK_SIZE, as it would consume way
// more memory than V8 will allow in a single string or ArrayBuffer.
export const MIN_CHUNK_SIZE = 24 as const;

const XOR_ZERO = 48 as const; // Shifts characters codes down by 48 so "0" is  0
const PIPE_XZ = 76 as const; // Shifted "|"'s character code

/**
 * Maybe parses a {@link ChunkFrame} *from a string*.
 *
 * a chunk frame is in the form: `<id>|<seq>|<fin><data>`, where:
 * - `<id>` is a unique number identifier for the chunked message
 * - `<total>` is the total number of chunks in the message
 * - `<seq>` is the sequence number of this chunk (0-based)
 * - `<data>` is the actual data of this chunk
 *
 * The reason we can't just send a message like "hey I'm about to send some chunks"
 * then send the message itself in bits, and then send an "I'm done sending the
 * chunks" message is because of a combination of three factors:
 *   1) we need to send the chunks without blocking the thread for too long;
 *      sending huge chunks can take several seconds.
 *   2) other parts of the system might _also_ send data over the same Port; so
 *      frames would be intermingled.
 *   3) I couldn't find documentation guaranteeing that sent `runtime.Port`
 *      messages are received in the order they are sent (hence the `seq`uence number we send)
 *
 * This function has been benchmarked and highly optimized, modify carefully.
 *
 * A Note:
 * The resulting *magnitudes* of the `id` and `seq` values aren't validated; we
 * are only checking that the *shape* of the message matches: `<digits>|<digits>|<0|1>|<data>`
 * and we _assume_ that the digits represent a number in the range <0, 2^31-1>,
 * per the design.
 *
 * While we could "fix" this with some checks, but it's not worth fixing, since
 * the problem at this point is really that something is spamming messages that
 * are in the *format* of a Chunk Frame, but... aren't actually Chunk Frames.
 * Since no message will contain this format on accident, I don't think it's
 * worth chasing.
 *
 * @param input - the string to parse
 * @param length - must be greater than 6, it is *not* validated within this
 * function; it is validated at the call-site instead.
 * @returns a {@link ChunkFrame} if the value is a valid chunk frame, otherwise null
 */
function maybeParseStringAsChunkFrame(
  input: string,
  length: number,
): ChunkFrame | null {
  // parse id
  let code = input.charCodeAt(0);
  let id = (code ^ XOR_ZERO) | 0;
  // first must be a digit
  if (id > 9) {
    return null;
  }
  let i = 1 | 0;
  for (;;) {
    if (i === length) {
      return null;
    }
    const d = (input.charCodeAt(i) ^ XOR_ZERO) | 0;
    if (d > 9) {
      // d isn't a digit (0-9)
      if (d === PIPE_XZ) {
        i++; // it's a "|"! We're done; skip the '|'.
        break;
      }
      return null;
    }
    i++;
    // we compute the id as we parse it from left to right.
    id = id * 10 + d;
  }

  if (i === length) {
    return null;
  }
  // parse seq
  code = input.charCodeAt(i);
  let seq = (code ^ XOR_ZERO) | 0;
  if (seq > 9) {
    return null;
  }
  i++;
  for (;;) {
    if (i >= length) {
      return null;
    }
    const d = (input.charCodeAt(i) ^ XOR_ZERO) | 0;
    if (d > 9) {
      if (d === PIPE_XZ) {
        i++; // it's a "|"! We're done; skip the '|'.
        break;
      }
      return null;
    }
    i++;
    // we compute the seq as we parse it from left to right.
    seq = seq * 10 + d;
  }

  if (i === length) {
    return null;
  }
  // parse fin
  const fin = ((input.charCodeAt(i) ^ XOR_ZERO) | 0) as Final;
  if (fin >>> 1 !== 0) {
    return null;
  }

  return { id, seq, fin, source: input, dataIndex: i + 1 };
}

/**
 * Maybe parses a {@link ChunkFrame}.
 *
 * a chunk frame is a string in the form: `<id>|<seq>|<fin><data>`, where:
 * - `<id>` is a unique number identifier for the chunked message
 * - `<total>` is the total number of chunks in the message
 * - `<seq>` is the sequence number of this chunk (0-based)
 * - `<data>` is the actual data of this chunk
 *
 * @param input - the value to try to parse
 * @returns a {@link ChunkFrame} if the value is a valid chunk frame, otherwise null
 */
function maybeParseAsChunkFrame(input: unknown): ChunkFrame | null {
  if (typeof input !== 'string') {
    return null;
  }
  const { length } = input;
  // shortest legal message is: "0|0|1D" (6 characters)
  if (length < 6) {
    return null;
  }
  return maybeParseStringAsChunkFrame(input, length);
}

// half a "frame" (at 60 fps) per chunk.
const FRAME_BUDGET = 1000 / 60 / 2;

const tick =
  // @ts-expect-error modern browsers have scheduler.yield() built in.
  scheduler && typeof scheduler['yield'] === 'function'
    ? // @ts-expect-error modern browsers have scheduler.yield() built in.
      globalThis.scheduler.yield.bind(globalThis.scheduler)
    : async () => await new Promise<void>((r) => setTimeout(r, 0));

/**
 * Converts a JSON object into an async generator of chunk frames.
 *
 * We use an async generator in order to allow other tasks to complete while
 * the chunking is happening.
 *
 * @param payload - the payload to be chunked
 * @param chunkSize - the size of each chunk in bytes. If `0`, returns the
 * payload as is. If the given `chunkSize` will result in a single frame, the
 * payload is returned as is.
 * @yields - a chunk frame or the original payload if it fits within a single
 * frame
 */
export async function* toFrames<Payload extends Json>(
  payload: Payload,
  chunkSize: number = CHUNK_SIZE,
): AsyncGenerator<TransportChunkFrame | Payload, void> {
  let begin = performance.now();
  const json = JSON.stringify(payload);
  const payloadLength = json.length;

  if (payloadLength < chunkSize) {
    // no need to chunk if it fits within a single frame
    yield payload;
    return;
  }

  // we need to leave space for our header
  const id = getNextId();
  let index = 0;
  let seq = 0;

  do {
    if (performance.now() - begin >= FRAME_BUDGET) {
      // prevent background processing from locking up for too long by allowing
      // other macro tasks to perform work between chunks
      await tick();
      begin = performance.now();
    }
    const header = `${id}|${seq}|` as const;
    const headerSize = header.length + 1; // +1 for fin
    // how much data can we send with this specific header?
    const partialDataLength = chunkSize - headerSize;
    // compute next `pos` to determine if this is the final frame
    const start = index;
    const end = Math.min(start + partialDataLength, payloadLength);
    const fin = end >= payloadLength ? 1 : 0;
    const frame: TransportChunkFrame = `${header}${fin}${json.substring(start, end)}`;
    yield frame;

    index = end;
    seq++;
  } while (index < payloadLength);
}

const TAG = '%cPortStream';
const STYLE_IN = 'color:#0b8;'; // inbound
const STYLE_OUT = 'color:#08f;'; // outbound
const STYLE_SYS = 'color:#888;'; // system

export class PortStream extends Duplex {
  private readonly port: Runtime.Port;

  private readonly inFlight = new Map<Id, QueuedEntry>();

  private chunkSize: number;

  private debug = false;

  private log: (d: unknown, out: boolean) => void;

  constructor(
    port: Runtime.Port,
    { chunkSize, debug, log, ...opts }: Options = {},
  ) {
    if (chunkSize && chunkSize < MIN_CHUNK_SIZE) {
      throw new Error(
        `Cannot chunk messages smaller than the min chunk size, ${MIN_CHUNK_SIZE}`,
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
      const frame = maybeParseAsChunkFrame(msg);
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
   * @param chunk - the {@link ChunkFrame} received from the port
   */
  private handleChunk(chunk: ChunkFrame) {
    const { id, seq, fin, source, dataIndex } = chunk;

    if (this.debug) {
      console.debug(
        TAG,
        STYLE_IN,
        `← frame #${seq + 1}/? id=${id} (${source.length - dataIndex} bytes)`,
      );
    }

    let entry = this.inFlight.get(id);
    if (entry) {
      entry.received += 1;
    } else {
      entry = {
        parts: [],
        expected: 0,
        received: 1,
      };
      this.inFlight.set(id, entry);
    }
    if (fin === 1) {
      entry.expected = seq + 1;
    }
    entry.parts[seq] = [source, dataIndex];

    if (entry.received === entry.expected) {
      this.inFlight.delete(id);
      this.log('received chunked message', false);
      const { parts } = entry;
      const { length } = parts;
      // use an array and then a single `join()` to avoid creating large
      // intermediary strings if we used string concatenation via something like
      // `raw += src.slice(idx)`.
      const segments = new Array(length);
      for (let i = 0; i < length; i++) {
        const [src, idx] = parts[i];
        segments[i] = src.slice(idx);
      }

      // only one final, engine-optimized, large string allocation
      const raw = segments.join('');
      this.push(JSON.parse(raw));
      if (this.debug) {
        console.debug(
          TAG,
          STYLE_IN,
          `✔ re-assembled id=${id} (${raw.length} bytes)`,
        );
      }
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
    this.inFlight.clear();
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
   * @param callback - the callback to invoke
   * @param error - the error to pass to the callback
   */
  private safeCallback(
    callback: (err?: Error | null) => void,
    error?: Error | null,
  ) {
    queueMicrotask(() => callback(error));
  }

  /**
   * Send a message to the other end. This takes one argument, which is a JSON
   * object representing the message to send. It will be delivered to any script
   * listening to the port's onMessage event, or to the native application if
   * this port is connected to a native application.
   *
   * @param message - the message to send
   */
  private postMessage(message: unknown) {
    if (this.debug) {
      console.debug(TAG, STYLE_OUT, '→', message);
    }
    this.port.postMessage(message);
  }

  /**
   * Handles writing to the port.
   *
   * @param chunk - the chunk to write.
   * @param encoding - encoding (must be UTF-8)
   * @param callback - callback to call when done
   */
  override async _write(
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
            for await (const frame of toFrames(chunk, chunkSize)) {
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
