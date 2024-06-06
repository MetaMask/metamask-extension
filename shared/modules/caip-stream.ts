import { isObject } from '@metamask/utils';
import { Transform, pipeline, Duplex } from 'readable-stream';

export class SplitStream extends Duplex {
  substream: Duplex;

  constructor(substream?: SplitStream) {
    super({ objectMode: true });
    this.substream = substream ?? new SplitStream(this);
  }

  _read() {
    return undefined;
  }

  _write(
    value: unknown,
    _encoding: BufferEncoding,
    callback: (error?: Error | null) => void,
  ) {
    this.substream.push(value);
    callback();
  }
}

export class CaipToMultiplexStream extends Transform {
  constructor() {
    super({ objectMode: true });
  }

  _write(
    value: unknown,
    _encoding: BufferEncoding,
    callback: (error?: Error | null) => void,
  ) {
    if (isObject(value) && value.type === 'caip-x') {
      this.push({
        name: 'metamask-provider',
        data: value.data,
      });
    }
    callback();
  }
}

export class MultiplexToCaipStream extends Transform {
  constructor() {
    super({ objectMode: true });
  }

  _write(
    value: unknown,
    _encoding: BufferEncoding,
    callback: (error?: Error | null) => void,
  ) {
    if (isObject(value) && value.name === 'metamask-provider') {
      this.push({
        type: 'caip-x',
        data: value.data,
      });
    }
    callback();
  }
}

/**
 * Creates a pipeline using a port stream meant to be consumed by the JSON-RPC engine:
 * - accepts only incoming CAIP messages intended for evm providers from the port stream
 * - translates those incoming messages into the internal multiplexed format for 'metamask-provider'
 * - writes these messages to a new stream that the JSON-RPC engine should operate off
 * - accepts only outgoing messages in the internal multiplexed format for 'metamask-provider' from this new stream
 * - translates those outgoing messages back to the CAIP message format
 * - writes these messages back to the port stream
 *
 * @param portStream - The source and sink duplex stream
 * @returns a new duplex stream that should be operated on instead of the original portStream
 */
export const createCaipStream = (portStream: Duplex): Duplex => {
  const splitStream = new SplitStream();
  const caipToMultiplexStream = new CaipToMultiplexStream();
  const multiplexToCaipStream = new MultiplexToCaipStream();

  pipeline(
    portStream,
    caipToMultiplexStream,
    splitStream,
    multiplexToCaipStream,
    portStream,
    (err: Error) => console.log('MetaMask CAIP stream', err),
  );

  return splitStream.substream;
};
