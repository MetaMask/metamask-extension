// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error pipeline() isn't defined as part of @types/readable-stream
import { pipeline, Duplex } from 'readable-stream';

class Substream extends Duplex {
  parent: Duplex;

  outputFilter: StreamMessageFilter;

  constructor(parent: Duplex, outputFilter?: StreamMessageFilter) {
    super({ objectMode: true });
    this.outputFilter = outputFilter;
    this.parent = parent;
  }

  _read() {
    return undefined;
  }

  _write(
    value: unknown,
    encoding: BufferEncoding,
    callback: (error?: Error | null) => void,
  ) {
    if (this.outputFilter(value, encoding)) {
      this.parent.push(value);
    }
    callback();
  }
}

export type StreamMessageFilter = (
  value: unknown,
  encoding: BufferEncoding,
) => boolean;

export class FilterStream extends Duplex {
  substream: Duplex;

  inputFilter: StreamMessageFilter;

  constructor(opts: {
    inputFilter: StreamMessageFilter;
    outputFilter: StreamMessageFilter;
  }) {
    super({ objectMode: true });
    this.inputFilter = opts.inputFilter;
    this.substream = new Substream(this, opts.outputFilter);
  }

  _read() {
    return undefined;
  }

  _write(
    value: unknown,
    encoding: BufferEncoding,
    callback: (error?: Error | null) => void,
  ) {
    if (this.inputFilter(value, encoding)) {
      this.substream.push(value);
    }
    callback();
  }
}

/**
 * Creates a pipeline using a port stream meant to be consumed by the JSON-RPC engine:
 * - accepts only incoming CAIP messages intended for evm providers from the port stream
 * - unwraps these incoming messages into a new stream that the JSON-RPC engine should operate off
 * - wraps the outgoing messages from the new stream back into the CAIP message format
 * - writes these messages back to the port stream
 *
 * @param portStream - The source and sink duplex stream
 * @param opts - The options object
 * @param opts.inputFilter - The optional function used to filter incoming messages
 * @param opts.outputFilter - The optional function used to filter outgoing messages
 * @returns a new duplex stream that should be operated on instead of the original portStream
 */
export const createFilterStream = (
  portStream: Duplex,
  opts: {
    inputFilter?: StreamMessageFilter;
    outputFilter?: StreamMessageFilter;
  },
): Duplex => {
  const noop = () => true;
  const filterStream = new FilterStream({
    inputFilter: opts.inputFilter || noop,
    outputFilter: opts.outputFilter || noop,
  });

  pipeline(portStream, filterStream, portStream, (err: Error) =>
    console.log('MetaMask Filter stream', err),
  );

  return filterStream.substream;
};
