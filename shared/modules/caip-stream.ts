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
