import { Duplex, PassThrough } from 'readable-stream';
import { createDeferredPromise } from '@metamask/utils';
import { createFilterStream } from './filter-stream';

const writeToStream = async (stream: Duplex, message: unknown) => {
  const { promise: isWritten, resolve: writeCallback } =
    createDeferredPromise();

  stream.write(message, () => writeCallback());
  await isWritten;
};

const readFromStream = (stream: Duplex): unknown[] => {
  const chunks: unknown[] = [];
  stream.on('data', (chunk: unknown) => {
    chunks.push(chunk);
  });

  return chunks;
};

class MockStream extends Duplex {
  chunks: unknown[] = [];

  constructor() {
    super({ objectMode: true });
  }

  _read() {
    return undefined;
  }

  _write(
    value: unknown,
    _encoding: BufferEncoding,
    callback: (error?: Error | null) => void,
  ) {
    this.chunks.push(value);
    callback();
  }
}

describe('Filter Stream', () => {
  describe('createFilterStream', () => {
    it('filters messages from source stream to the substream when inputFilter is provided', async () => {
      const sourceStream = new PassThrough({ objectMode: true });
      const sourceStreamChunks = readFromStream(sourceStream);

      const inputFilter = jest.fn().mockReturnValueOnce(true);

      const filterStream = createFilterStream(sourceStream, { inputFilter });
      const filterStreamChunks = readFromStream(filterStream);

      await writeToStream(sourceStream, {
        message: 1,
      });
      await writeToStream(sourceStream, {
        message: 2,
      });

      expect(inputFilter).toHaveBeenCalledWith(
        { message: 1 },
        expect.any(String),
      );
      expect(inputFilter).toHaveBeenCalledWith(
        { message: 2 },
        expect.any(String),
      );
      expect(sourceStreamChunks).toStrictEqual([
        { message: 1 },
        { message: 2 },
      ]);
      expect(filterStreamChunks).toStrictEqual([{ message: 1 }]);
    });

    it('passes through all messages from source stream to the substream when inputFilter is not provided', async () => {
      const sourceStream = new PassThrough({ objectMode: true });
      const sourceStreamChunks = readFromStream(sourceStream);

      const filterStream = createFilterStream(sourceStream, {});
      const filterStreamChunks = readFromStream(filterStream);

      await writeToStream(sourceStream, {
        message: 1,
      });
      await writeToStream(sourceStream, {
        message: 2,
      });

      expect(sourceStreamChunks).toStrictEqual([
        { message: 1 },
        { message: 2 },
      ]);
      expect(filterStreamChunks).toStrictEqual([
        { message: 1 },
        { message: 2 },
      ]);
    });

    it('filters messages from the substream to the source stream when outputFilter is provided', async () => {
      // using a fake stream here instead of PassThrough to prevent a loop
      // when sourceStream gets written back to at the end of the CAIP pipeline
      const sourceStream = new MockStream();

      const outputFilter = jest.fn().mockReturnValueOnce(true);
      const filterStream = createFilterStream(sourceStream, {
        outputFilter,
      });

      await writeToStream(filterStream, {
        message: 1,
      });
      await writeToStream(filterStream, {
        message: 2,
      });

      expect(outputFilter).toHaveBeenCalledWith(
        { message: 1 },
        expect.any(String),
      );
      expect(outputFilter).toHaveBeenCalledWith(
        { message: 2 },
        expect.any(String),
      );
      // Note that it's not possible to verify the output side of the internal SplitStream
      // instantiated inside createFilterStream as only the substream is actually exported
      expect(sourceStream.chunks).toStrictEqual([{ message: 1 }]);
    });

    it('passes through all messages from the substream to the source stream when outputFilter is not provided', async () => {
      // using a fake stream here instead of PassThrough to prevent a loop
      // when sourceStream gets written back to at the end of the CAIP pipeline
      const sourceStream = new MockStream();

      const filterStream = createFilterStream(sourceStream, {});

      await writeToStream(filterStream, {
        message: 1,
      });
      await writeToStream(filterStream, {
        message: 2,
      });

      // Note that it's not possible to verify the output side of the internal SplitStream
      // instantiated inside createFilterStream as only the substream is actually exported
      expect(sourceStream.chunks).toStrictEqual([
        { message: 1 },
        { message: 2 },
      ]);
    });
  });
});
