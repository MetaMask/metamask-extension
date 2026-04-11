import ObjectMultiplex from '@metamask/object-multiplex';

import { PATCH_STORE_SUBSTREAM_METHODS } from '../../shared/constants/patch-store-substream-methods';
import randomId from '../../shared/lib/random-id';
import { flushPromises } from '../../test/lib/timer-helpers';
import {
  PatchStoreSubstreamConnection,
  getStatePatches,
  setupPatchStoreSubstreamConnection,
} from './patch-store-substream-connection';

jest.mock('../../shared/lib/random-id');

const randomIdMock = jest.mocked(randomId);

/**
 * Creates a pair of connected substreams to match how streams are wired between
 * the background and UI.
 */
function createPatchStreamPair() {
  const uiMux = new ObjectMultiplex();
  const backgroundMux = new ObjectMultiplex();
  uiMux.pipe(backgroundMux).pipe(uiMux);

  const uiStream = uiMux.createStream('patch-store');
  const backgroundStream = backgroundMux.createStream('patch-store');

  return { uiMux, uiStream, backgroundStream };
}

/**
 * A wrapper for `flushPromises`, which really flushes microtasks, but in our
 * case is useful to flush buffered writes that occur through ObjectMultiplex.
 * Tests must await this function after writing to a stream before asserting on
 * the outcome.
 */
async function flushBufferedWrites() {
  await flushPromises();
}

describe('PatchStoreSubstreamConnection', () => {
  beforeEach(() => {
    randomIdMock.mockReturnValue(99999999999);
  });

  describe('when a message is received', () => {
    it('calls handleSendUpdate when a valid sendUpdate notification is received', async () => {
      const { uiStream, backgroundStream } = createPatchStreamPair();
      const handleSendUpdate = jest.fn();
      // We just need to listen for messages.
      // eslint-disable-next-line no-new
      new PatchStoreSubstreamConnection(uiStream, { handleSendUpdate });
      const notification = {
        jsonrpc: '2.0',
        method: PATCH_STORE_SUBSTREAM_METHODS.SendUpdate,
        params: [[{ op: 'replace', path: ['x'], value: 1 }]],
      };

      backgroundStream.write(notification);
      await flushBufferedWrites();

      expect(handleSendUpdate).toHaveBeenCalledWith(
        expect.objectContaining(notification),
      );
    });

    it('calls handleSendUpdate when the sendUpdate notification data contains undefined (invalid JSON)', async () => {
      const { uiStream, backgroundStream } = createPatchStreamPair();
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      const handleSendUpdate = jest.fn();
      // We just need to listen for messages.
      // eslint-disable-next-line no-new
      new PatchStoreSubstreamConnection(uiStream, { handleSendUpdate });
      const notification = {
        jsonrpc: '2.0',
        method: PATCH_STORE_SUBSTREAM_METHODS.SendUpdate,
        params: [[{ op: 'replace', path: ['x'], value: undefined }]],
      };

      backgroundStream.write(notification);
      await flushBufferedWrites();

      expect(consoleSpy).not.toHaveBeenCalled();
      expect(handleSendUpdate).toHaveBeenCalled();
    });

    it('logs an error when handleSendUpdate throws', async () => {
      const { uiStream, backgroundStream } = createPatchStreamPair();
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      const error = new Error('handleSendUpdate failed');
      // We just need to listen for messages.
      // eslint-disable-next-line no-new
      new PatchStoreSubstreamConnection(uiStream, {
        handleSendUpdate: jest.fn().mockRejectedValue(error),
      });
      const notification = {
        jsonrpc: '2.0',
        method: PATCH_STORE_SUBSTREAM_METHODS.SendUpdate,
        params: [[{ op: 'replace' as const, path: ['x'], value: 1 }]],
      };

      backgroundStream.write(notification);
      await flushBufferedWrites();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error receiving message through patch-store stream',
        error,
      );
    });

    it('logs a warning when a notification is received with an unknown method', async () => {
      const { uiStream, backgroundStream } = createPatchStreamPair();
      const consoleSpy = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => undefined);
      // We just need to listen for messages.
      // eslint-disable-next-line no-new
      new PatchStoreSubstreamConnection(uiStream, {
        handleSendUpdate: jest.fn(),
      });
      const notification = {
        jsonrpc: '2.0',
        method: 'unknown',
      };

      backgroundStream.write(notification);
      await flushBufferedWrites();

      expect(consoleSpy).toHaveBeenCalledWith(
        "Invalid method 'unknown' for patch-store notification",
      );
    });

    it('logs an error when a response for an unknown request is received', async () => {
      const { uiStream, backgroundStream } = createPatchStreamPair();
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      // We just need to listen for messages.
      // eslint-disable-next-line no-new
      new PatchStoreSubstreamConnection(uiStream, {
        handleSendUpdate: jest.fn(),
      });
      const message = {
        id: 42,
        jsonrpc: '2.0',
        // Responses aren't supposed to contain methods
        method: 'unknown',
        result: [],
      };

      backgroundStream.write(message);
      await flushBufferedWrites();

      expect(consoleSpy).toHaveBeenCalledWith(
        "Encountered response for unexpected patch-store stream request '42'",
        message,
      );
    });

    it('logs an error when an object without a "id" or "method" property is received', async () => {
      const { uiStream, backgroundStream } = createPatchStreamPair();
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      // We just need to listen for messages.
      // eslint-disable-next-line no-new
      new PatchStoreSubstreamConnection(uiStream, {
        handleSendUpdate: jest.fn(),
      });
      const message = {
        jsonrpc: '2.0',
        result: [],
      };

      backgroundStream.write(message);
      await flushBufferedWrites();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Unknown patch-store message',
        message,
      );
    });

    it('logs an error when a non-object is received', async () => {
      const { uiStream, backgroundStream } = createPatchStreamPair();
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      // We just need to listen for messages.
      // eslint-disable-next-line no-new
      new PatchStoreSubstreamConnection(uiStream, {
        handleSendUpdate: jest.fn(),
      });
      const message = 'some-message';

      backgroundStream.write(message);
      await flushBufferedWrites();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Unknown patch-store message',
        message,
      );
    });
  });

  describe('getStatePatches', () => {
    it('writes a request to the stream', async () => {
      const { uiStream, backgroundStream } = createPatchStreamPair();
      const sentMessages: unknown[] = [];
      backgroundStream.on('data', (msg) => sentMessages.push(msg));
      randomIdMock.mockReturnValue(42);
      const connection = new PatchStoreSubstreamConnection(uiStream, {
        handleSendUpdate: jest.fn(),
      });

      const patchesPromise = connection.getStatePatches();
      await flushBufferedWrites();

      expect(sentMessages).toContainEqual(
        expect.objectContaining({
          id: 42,
          jsonrpc: '2.0',
          method: PATCH_STORE_SUBSTREAM_METHODS.GetStatePatches,
        }),
      );

      // Resolve so the test does not hang
      backgroundStream.write({ jsonrpc: '2.0', id: 42, result: [] });
      await patchesPromise;
    });

    it('returns patches read from the stream', async () => {
      const { uiStream, backgroundStream } = createPatchStreamPair();
      const expectedPatches = [{ op: 'replace', path: ['foo'], value: 'bar' }];
      randomIdMock.mockReturnValue(42);
      const connection = new PatchStoreSubstreamConnection(uiStream, {
        handleSendUpdate: jest.fn(),
      });

      const patchesPromise = connection.getStatePatches();
      backgroundStream.write({
        jsonrpc: '2.0',
        id: 42,
        result: expectedPatches,
      });

      const actualPatches = await patchesPromise;
      expect(actualPatches).toStrictEqual(expectedPatches);
    });

    it('throws when receiving an error through the stream', async () => {
      const { uiStream, backgroundStream } = createPatchStreamPair();
      const rpcError = { code: -32000, message: 'Internal error' };
      randomIdMock.mockReturnValue(42);
      const connection = new PatchStoreSubstreamConnection(uiStream, {
        handleSendUpdate: jest.fn(),
      });

      const patchesPromise = connection.getStatePatches();
      backgroundStream.write({ jsonrpc: '2.0', id: 42, error: rpcError });

      await expect(patchesPromise).rejects.toStrictEqual(rpcError);
    });

    it('resolves without logging an error when the response contains undefined (invalid JSON)', async () => {
      const { uiStream, backgroundStream } = createPatchStreamPair();
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      randomIdMock.mockReturnValue(42);
      const connection = new PatchStoreSubstreamConnection(uiStream, {
        handleSendUpdate: jest.fn(),
      });

      const patchesPromise = connection.getStatePatches();
      backgroundStream.write({
        jsonrpc: '2.0',
        id: 42,
        result: [{ op: 'replace', path: ['foo'], value: undefined }],
      });

      const patches = await patchesPromise;
      expect(consoleSpy).not.toHaveBeenCalled();
      expect(patches).toStrictEqual([
        { op: 'replace', path: ['foo'], value: undefined },
      ]);
    });

    it('does not throw when the response data is not an array of patches', async () => {
      const { uiStream, backgroundStream } = createPatchStreamPair();
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      randomIdMock.mockReturnValue(42);
      const connection = new PatchStoreSubstreamConnection(uiStream, {
        handleSendUpdate: jest.fn(),
      });
      const patchesPromise = connection.getStatePatches();
      backgroundStream.write({
        jsonrpc: '2.0',
        id: 42,
        result: 'not-an-array',
      });

      const patches = await patchesPromise;
      expect(consoleSpy).not.toHaveBeenCalled();
      expect(patches).toStrictEqual('not-an-array');
    });
  });

  describe('rejectAllPendingRequests', () => {
    it('rejects all pending getStatePatches requests with a "closed" error', async () => {
      const { uiStream } = createPatchStreamPair();
      const connection = new PatchStoreSubstreamConnection(uiStream, {
        handleSendUpdate: jest.fn(),
      });

      const patchesPromise = connection.getStatePatches();
      connection.rejectAllPendingRequests();

      await expect(patchesPromise).rejects.toThrow(
        'Patch-store substream closed, aborting request',
      );
    });

    it('does not throw when there are no pending requests', () => {
      const { uiStream } = createPatchStreamPair();
      const connection = new PatchStoreSubstreamConnection(uiStream, {
        handleSendUpdate: jest.fn(),
      });

      expect(() => connection.rejectAllPendingRequests()).not.toThrow();
    });
  });
});

describe('setupPatchStoreSubstreamConnection', () => {
  it('logs an error and returns an empty array when the patch-store substream has not been initialized', async () => {
    const originalInTest = process.env.IN_TEST;
    delete process.env.IN_TEST;
    try {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      const patches = await getStatePatches();
      expect(patches).toStrictEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Patch-store substream has not been initialized, not sending message',
      );
    } finally {
      if (originalInTest !== undefined) {
        process.env.IN_TEST = originalInTest;
      }
    }
  });

  it('does not log an error and returns an empty array when the patch-store substream has not been initialized and IN_TEST is set', async () => {
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const patches = await getStatePatches();
    expect(patches).toStrictEqual([]);
    expect(consoleSpy).not.toHaveBeenCalled();
  });
});

describe('getStatePatches', () => {
  beforeEach(() => {
    randomIdMock.mockReturnValue(99999999999);
  });

  it('returns patches read from the stream after making a request', async () => {
    await withPatchStoreSubstreamConnection(async ({ backgroundStream }) => {
      randomIdMock.mockReturnValue(42);
      const expectedPatches = [{ op: 'replace', path: ['foo'], value: 'bar' }];

      const patchesPromise = getStatePatches();
      backgroundStream.write({
        jsonrpc: '2.0',
        id: 42,
        result: expectedPatches,
      });

      const actualPatches = await patchesPromise;
      expect(actualPatches).toStrictEqual(expectedPatches);
    });
  });

  it('rejects when the stream is destroyed while a request is in flight', async () => {
    await withPatchStoreSubstreamConnection(async ({ uiMux }) => {
      const patchesPromise = getStatePatches();
      uiMux.destroy();

      await expect(patchesPromise).rejects.toThrow(
        'Patch-store substream closed, aborting request',
      );
    });
  });

  it('throws if the stream has already ended before a request is written', async () => {
    await withPatchStoreSubstreamConnection(async ({ uiStream }) => {
      uiStream.end();

      await expect(getStatePatches()).rejects.toThrow(
        'Patch-store substream closed',
      );
    });
  });

  it('returns an empty array if the stream is already destroyed before a request is written', async () => {
    await withPatchStoreSubstreamConnection(async ({ uiMux, uiStream }) => {
      let caughtError;
      uiStream.on('error', (error) => {
        caughtError = error;
      });
      uiMux.destroy();
      await flushBufferedWrites();

      expect(caughtError).toMatchObject({
        message: 'Premature close',
      });
      expect(await getStatePatches()).toStrictEqual([]);
    });
  });
});

/**
 * Sets up the patch-store substream connection singleton, calls the given
 * function with the stream pair, then always tears down the singleton
 * afterward.
 *
 * @param fn - The function to call with the stream pair.
 */
async function withPatchStoreSubstreamConnection(
  fn: (streams: ReturnType<typeof createPatchStreamPair>) => Promise<void>,
) {
  const streams = createPatchStreamPair();
  setupPatchStoreSubstreamConnection(streams.uiStream, {
    handleSendUpdate: jest.fn(),
  });
  try {
    await fn(streams);
  } finally {
    // Suppress the error that may occur when destroying the stream
    streams.uiStream.on('error', () => {
      // Do nothing
    });
    streams.uiMux.destroy();
    await flushBufferedWrites();
  }
}
