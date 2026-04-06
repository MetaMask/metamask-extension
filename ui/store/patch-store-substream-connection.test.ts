import ObjectMultiplex from '@metamask/object-multiplex';

import { GET_STATE_PATCHES, SEND_UPDATE } from '../../shared/constants/patches';
import randomId from '../../shared/lib/random-id';
import { flushPromises } from '../../test/lib/timer-helpers';
import {
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

describe('patch-store substream connection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('setupPatchStoreSubstreamConnection', () => {
    it('calls handleSendUpdate when a valid sendUpdate notification is received', async () => {
      const { uiStream, backgroundStream } = createPatchStreamPair();
      const handleSendUpdate = jest.fn();
      setupPatchStoreSubstreamConnection(uiStream, { handleSendUpdate });
      const notification = {
        jsonrpc: '2.0',
        method: SEND_UPDATE,
        params: [[{ op: 'replace', path: ['x'], value: 1 }]],
      };

      backgroundStream.write(notification);
      await flushBufferedWrites();

      expect(handleSendUpdate).toHaveBeenCalledWith(
        expect.objectContaining(notification),
      );
    });

    it('calls handleSendUpdate when a sendUpdate notification contains a patch with not quite valid JSON (a value is undefined)', async () => {
      const { uiStream, backgroundStream } = createPatchStreamPair();
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      const handleSendUpdate = jest.fn();
      setupPatchStoreSubstreamConnection(uiStream, { handleSendUpdate });
      const notification = {
        jsonrpc: '2.0',
        method: SEND_UPDATE,
        params: [[{ op: 'replace', path: ['x'], value: undefined }]],
      };

      backgroundStream.write(notification);
      await flushBufferedWrites();

      expect(consoleSpy).not.toHaveBeenCalled();
      expect(handleSendUpdate).toHaveBeenCalled();
    });

    it('logs an error if handleSendUpdate throws', async () => {
      const { uiStream, backgroundStream } = createPatchStreamPair();
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      const error = new Error('handleSendUpdate failed');
      setupPatchStoreSubstreamConnection(uiStream, {
        handleSendUpdate: jest.fn().mockRejectedValue(error),
      });
      const notification = {
        jsonrpc: '2.0',
        method: SEND_UPDATE,
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
      setupPatchStoreSubstreamConnection(uiStream, {
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
      setupPatchStoreSubstreamConnection(uiStream, {
        handleSendUpdate: jest.fn(),
      });
      // Responses aren't supposed to contain methods
      const message = {
        id: 42,
        jsonrpc: '2.0',
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
  });

  describe('getStatePatches', () => {
    it('logs an error and returns an empty array when the patch-store substream has not been initialized', async () => {
      const originalInTest = process.env.IN_TEST;
      delete process.env.IN_TEST;
      try {
        // We have to isolate the module here because there's no way to reset
        // `patchStoreSubstreamSingleton` once it's set.
        await jest.isolateModulesAsync(async () => {
          const consoleSpy = jest
            .spyOn(console, 'error')
            .mockImplementation(() => undefined);
          // We have to use `require` rather than `import`: TypeScript requires
          // that we specify `.ts` as an extension, but Jest doesn't know how to
          // resolve it. Finally we have to prevent the line from getting broken
          // up so that we can apply these ignores.
          // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
          const { getStatePatches: isolatedGetStatePatches } = require('./patch-store-substream-connection'); // prettier-ignore
          const patches = await isolatedGetStatePatches();
          expect(patches).toStrictEqual([]);
          expect(consoleSpy).toHaveBeenCalledWith(
            'Patch-store substream has not been initialized, not sending message',
          );
        });
      } finally {
        if (originalInTest !== undefined) {
          process.env.IN_TEST = originalInTest;
        }
      }
    });

    it('writes a getStatePatches JSON-RPC request to the substream', async () => {
      const { uiStream, backgroundStream } = createPatchStreamPair();
      const sentMessages: unknown[] = [];
      backgroundStream.on('data', (msg) => sentMessages.push(msg));
      randomIdMock.mockReturnValue(42);
      setupPatchStoreSubstreamConnection(uiStream, {
        handleSendUpdate: jest.fn(),
      });

      const patchesPromise = getStatePatches();
      await flushBufferedWrites();

      expect(sentMessages).toContainEqual(
        expect.objectContaining({
          id: 42,
          jsonrpc: '2.0',
          method: GET_STATE_PATCHES,
        }),
      );

      // Resolve so the test does not hang
      backgroundStream.write({ jsonrpc: '2.0', id: 42, result: [] });
      await patchesPromise;
    });

    it('returns the patches from the background response', async () => {
      const { uiStream, backgroundStream } = createPatchStreamPair();
      const expectedPatches = [{ op: 'replace', path: ['foo'], value: 'bar' }];
      randomIdMock.mockReturnValue(42);
      setupPatchStoreSubstreamConnection(uiStream, {
        handleSendUpdate: jest.fn(),
      });

      const patchesPromise = getStatePatches();
      backgroundStream.write({
        jsonrpc: '2.0',
        id: 42,
        result: expectedPatches,
      });

      const actualPatches = await patchesPromise;
      expect(actualPatches).toStrictEqual(expectedPatches);
    });

    it('throws when the background responds with an error', async () => {
      const { uiStream, backgroundStream } = createPatchStreamPair();
      const rpcError = { code: -32000, message: 'Internal error' };
      randomIdMock.mockReturnValue(42);
      setupPatchStoreSubstreamConnection(uiStream, {
        handleSendUpdate: jest.fn(),
      });

      const patchesPromise = getStatePatches();
      backgroundStream.write({ jsonrpc: '2.0', id: 42, error: rpcError });

      await expect(patchesPromise).rejects.toStrictEqual(rpcError);
    });

    it('does not log an error and resolves when a getStatePatches response contains a patch with not quite valid JSON (contains undefined)', async () => {
      const { uiStream, backgroundStream } = createPatchStreamPair();
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      randomIdMock.mockReturnValue(42);
      setupPatchStoreSubstreamConnection(uiStream, {
        handleSendUpdate: jest.fn(),
      });

      const patchesPromise = getStatePatches();
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

    it('does not throw when a getStatePatches response result is not an array of patches', async () => {
      const { uiStream, backgroundStream } = createPatchStreamPair();
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      randomIdMock.mockReturnValue(42);
      setupPatchStoreSubstreamConnection(uiStream, {
        handleSendUpdate: jest.fn(),
      });
      const patchesPromise = getStatePatches();
      backgroundStream.write({
        jsonrpc: '2.0',
        id: 42,
        result: 'not-an-array',
      });

      const patches = await patchesPromise;
      expect(consoleSpy).not.toHaveBeenCalled();
      expect(patches).toStrictEqual('not-an-array');
    });

    it('rejects pending requests when the stream is destroyed', async () => {
      const { uiMux, uiStream } = createPatchStreamPair();
      randomIdMock.mockReturnValue(42);
      setupPatchStoreSubstreamConnection(uiStream, {
        handleSendUpdate: jest.fn(),
      });
      // Suppress the 'error' event that fires alongside 'close' on destroy
      uiStream.on('error', () => {
        // Do nothing
      });

      const patchesPromise = getStatePatches();
      uiMux.destroy();

      await expect(patchesPromise).rejects.toThrow(
        'Patch-store substream closed, aborting request',
      );
    });

    it('throws if the stream has already ended', async () => {
      const { uiStream } = createPatchStreamPair();
      randomIdMock.mockReturnValue(42);
      setupPatchStoreSubstreamConnection(uiStream, {
        handleSendUpdate: jest.fn(),
      });
      uiStream.end();

      await expect(getStatePatches()).rejects.toThrow(
        'Patch-store substream closed',
      );
    });

    it('returns an empty array if the stream is already destroyed', async () => {
      const { uiMux, uiStream } = createPatchStreamPair();
      randomIdMock.mockReturnValue(42);
      setupPatchStoreSubstreamConnection(uiStream, {
        handleSendUpdate: jest.fn(),
      });
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
