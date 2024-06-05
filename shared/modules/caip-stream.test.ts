import { Duplex } from 'readable-stream';
import { deferredPromise } from '../../app/scripts/lib/util';
import {
  createCaipStream,
  SplitStream,
  CaipToMultiplexStream,
  MultiplexToCaipStream,
} from './caip-stream';

const writeToStream = async (stream: Duplex, message: unknown) => {
  const { promise: isWritten, resolve: writeCallback } = deferredPromise();

  stream.write(message, writeCallback);
  await isWritten;
};

describe('CAIP Stream', () => {
  describe('SplitStream', () => {
    it('redirects writes from the main stream to the substream', async () => {
      const splitStream = new SplitStream();

      const outerStreamChunks: unknown[] = [];
      splitStream.on('data', (chunk: unknown) => {
        outerStreamChunks.push(chunk);
      });

      const innerStreamChunks: unknown[] = [];
      splitStream.substream.on('data', (chunk: unknown) => {
        innerStreamChunks.push(chunk);
      });

      await writeToStream(splitStream, { foo: 'bar' });

      expect(outerStreamChunks).toStrictEqual([]);
      expect(innerStreamChunks).toStrictEqual([{ foo: 'bar' }]);
    });

    it('redirects writes from the substream to the main stream', async () => {
      const splitStream = new SplitStream();

      const outerStreamChunks: unknown[] = [];
      splitStream.on('data', (chunk: unknown) => {
        outerStreamChunks.push(chunk);
      });

      const innerStreamChunks: unknown[] = [];
      splitStream.substream.on('data', (chunk: unknown) => {
        innerStreamChunks.push(chunk);
      });

      await writeToStream(splitStream.substream, { foo: 'bar' });

      expect(outerStreamChunks).toStrictEqual([{ foo: 'bar' }]);
      expect(innerStreamChunks).toStrictEqual([]);
    });
  });

  describe('CaipToMultiplexStream', () => {
    it('drops non caip-x messages', async () => {
      const caipToMultiplexStream = new CaipToMultiplexStream();

      const streamChunks: unknown[] = [];
      caipToMultiplexStream.on('data', (chunk: unknown) => {
        streamChunks.push(chunk);
      });

      await writeToStream(caipToMultiplexStream, { foo: 'bar' });
      await writeToStream(caipToMultiplexStream, {
        type: 'caip-wrong',
        data: { foo: 'bar' },
      });

      expect(streamChunks).toStrictEqual([]);
    });

    it('rewraps caip-x messages into multiplexed `metamask-provider` messages', async () => {
      const caipToMultiplexStream = new CaipToMultiplexStream();

      const streamChunks: unknown[] = [];
      caipToMultiplexStream.on('data', (chunk: unknown) => {
        streamChunks.push(chunk);
      });

      await writeToStream(caipToMultiplexStream, {
        type: 'caip-x',
        data: { foo: 'bar' },
      });

      expect(streamChunks).toStrictEqual([
        {
          name: 'metamask-provider',
          data: { foo: 'bar' },
        },
      ]);
    });
  });

  describe('MultiplexToCaipStream', () => {
    it('drops non multiplexed `metamask-provider` messages', async () => {
      const multiplexToCaipStream = new MultiplexToCaipStream();

      const streamChunks: unknown[] = [];
      multiplexToCaipStream.on('data', (chunk: unknown) => {
        streamChunks.push(chunk);
      });

      await writeToStream(multiplexToCaipStream, { foo: 'bar' });
      await writeToStream(multiplexToCaipStream, {
        name: 'wrong-multiplex',
        data: { foo: 'bar' },
      });

      expect(streamChunks).toStrictEqual([]);
    });

    it('rewraps multiplexed `metamask-provider` messages into caip-x messages', async () => {
      const multiplexToCaipStream = new MultiplexToCaipStream();

      const streamChunks: unknown[] = [];
      multiplexToCaipStream.on('data', (chunk: unknown) => {
        streamChunks.push(chunk);
      });

      await writeToStream(multiplexToCaipStream, {
        name: 'metamask-provider',
        data: { foo: 'bar' },
      });

      expect(streamChunks).toStrictEqual([
        {
          type: 'caip-x',
          data: { foo: 'bar' },
        },
      ]);
    });
  });

  describe('createCaipStream', () => {
    it('pipes a caip-x message from source stream to the substream as a multiplexed `metamask-provider` message', async () => {
      const sourceStreamChunks: unknown[] = []
      const sourceStream = new Duplex({
        objectMode: true,
        read: () => undefined,
        write: (chunk, _encoding, callback) => {
          sourceStreamChunks.push(chunk)
          callback()
        }
      })

      const providerStream = createCaipStream(sourceStream)
      const providerStreamChunks: unknown[] = [];
      providerStream.on('data', (chunk: unknown) => {
        providerStreamChunks.push(chunk);
      });

      await writeToStream(sourceStream, {type: 'caip-x', data: {foo: 'bar'}})

      expect(sourceStreamChunks).toStrictEqual([{type: 'caip-x', data: {foo: 'bar'}}])
      expect(providerStreamChunks).toStrictEqual([{name: 'metamask-provider', data: {foo: 'bar'}}])
    })
  })
});
