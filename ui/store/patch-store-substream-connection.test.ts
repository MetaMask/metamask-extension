import ObjectMultiplex from '@metamask/object-multiplex';
import { is } from '@metamask/superstruct';

import { GET_STATE_PATCHES, SEND_UPDATE } from '../../shared/constants/patches';
import * as randomId from '../../shared/lib/random-id';
import { flushPromises } from '../../test/lib/timer-helpers';
import {
  getStatePatches,
  PatchesStruct,
  setupPatchStoreSubstreamConnection,
} from './patch-store-substream-connection';

jest.mock('../../shared/lib/random-id');

const mockGetNextId = jest.mocked(randomId.default);

/**
 * Creates a pair of connected patch-store substreams using real ObjectMultiplex
 * instances piped together, matching the background ↔ UI stream topology.
 *
 * Returns:
 * - `uiStream`: the stream to pass to `setupPatchStoreSubstreamConnection`
 * - `backgroundStream`: the stream tests write to, simulating messages from
 * the background process
 */
function createPatchStreamPair() {
  const uiMux = new ObjectMultiplex();
  const backgroundMux = new ObjectMultiplex();
  uiMux.pipe(backgroundMux).pipe(uiMux);

  const uiStream = uiMux.createStream('patch-store');
  const backgroundStream = backgroundMux.createStream('patch-store');

  return { uiStream, backgroundStream };
}

/**
 * Wraps a microtask flush to reframe why we are using it: stream writes through
 * ObjectMultiplex are buffered and delivered asynchronously, so tests must
 * await this after writing to a stream before asserting on the outcome.
 */
async function flushBufferedWrites() {
  await flushPromises();
}

describe('patch-store substream connection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PatchesStruct', () => {
    it('validates a valid replace patch', () => {
      const input = [
        {
          op: 'replace',
          path: ['foo'],
          value: 'bar',
        },
      ];
      expect(is(input, PatchesStruct)).toBe(true);
    });

    it('validates a valid remove patch', () => {
      const input = [
        {
          op: 'remove',
          path: ['foo'],
        },
      ];

      expect(is(input, PatchesStruct)).toBe(true);
    });

    it('validates a valid add patch', () => {
      const input = [
        {
          op: 'add',
          path: ['foo', 0],
          value: 42,
        },
      ];
      expect(is(input, PatchesStruct)).toBe(true);
    });

    it('rejects a patch with an unknown op', () => {
      const input = [
        {
          op: 'copy',
          path: ['foo'],
          value: 'bar',
        },
      ];
      expect(is(input, PatchesStruct)).toBe(false);
    });

    it('rejects a non-array', () => {
      const input = {
        op: 'replace',
        path: [],
        value: {},
      };
      expect(is(input, PatchesStruct)).toBe(false);
    });

    it('rejects a patch with a missing path', () => {
      const input = [
        {
          op: 'replace',
          value: 'bar',
        },
      ];
      expect(is(input, PatchesStruct)).toBe(false);
    });

    it('validates an empty array', () => {
      expect(is([], PatchesStruct)).toBe(true);
    });
  });

  describe('setupPatchStoreSubstreamConnection', () => {
    it('calls handleSendUpdate when a valid sendUpdate notification is received', async () => {
      const { uiStream, backgroundStream } = createPatchStreamPair();
      const handleSendUpdate = jest.fn();
      const patches = [{ op: 'replace' as const, path: ['y'], value: 2 }];
      setupPatchStoreSubstreamConnection(uiStream, { handleSendUpdate });
      const notification = {
        jsonrpc: '2.0',
        method: SEND_UPDATE,
        params: [patches],
      };

      backgroundStream.write(notification);
      await flushBufferedWrites();

      expect(handleSendUpdate).toHaveBeenCalledWith(
        expect.objectContaining(notification),
      );
    });

    it('logs an error (including the Superstruct validation message) when a sendUpdate notification is received with an invalid patch array', async () => {
      const { uiStream, backgroundStream } = createPatchStreamPair();
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      setupPatchStoreSubstreamConnection(uiStream, {
        handleSendUpdate: jest.fn(),
      });
      const notification = {
        jsonrpc: '2.0',
        method: SEND_UPDATE,
        params: ['not-a-patch-array'],
      };

      backgroundStream.write(notification);
      await flushBufferedWrites();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Invalid patch-store update: At path: 0 -- Expected an array value, but received: "not-a-patch-array"',
        notification,
      );
    });

    it('logs an error when a notification is received with an unknown method', async () => {
      const { uiStream, backgroundStream } = createPatchStreamPair();
      const consoleSpy = jest
        .spyOn(console, 'error')
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

    it('calls handleSendUpdate when a sendUpdate notification contains a patch with not quite valid JSON (contains undefined)', async () => {
      const { uiStream, backgroundStream } = createPatchStreamPair();
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      const handleSendUpdate = jest.fn();
      setupPatchStoreSubstreamConnection(uiStream, { handleSendUpdate });
      const notification = {
        jsonrpc: '2.0',
        method: SEND_UPDATE,
        params: [[{ op: 'replace', path: ['foo'], value: undefined }]],
      };

      backgroundStream.write(notification);
      await flushBufferedWrites();

      expect(consoleSpy).not.toHaveBeenCalled();
      expect(handleSendUpdate).toHaveBeenCalled();
    });

    it('logs an error when an invalid message is received', async () => {
      const { uiStream, backgroundStream } = createPatchStreamPair();
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      setupPatchStoreSubstreamConnection(uiStream, {
        handleSendUpdate: jest.fn(),
      });
      // Responses aren't supposed to contain methods
      const message = {
        id: 9999,
        jsonrpc: '2.0',
        method: 'unknown',
        result: [],
      };

      backgroundStream.write(message);
      await flushBufferedWrites();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Unrecognized patch-store substream message (not a response or notification)',
        message,
      );
    });
  });

  describe('getStatePatches', () => {
    it('writes a getStatePatches JSON-RPC request to the substream', async () => {
      const { uiStream, backgroundStream } = createPatchStreamPair();
      const sentMessages: unknown[] = [];
      backgroundStream.on('data', (msg) => sentMessages.push(msg));
      mockGetNextId.mockReturnValue(10);
      setupPatchStoreSubstreamConnection(uiStream, {
        handleSendUpdate: jest.fn(),
      });

      const patchesPromise = getStatePatches();
      await flushBufferedWrites();

      expect(sentMessages).toContainEqual(
        expect.objectContaining({
          id: 10,
          jsonrpc: '2.0',
          method: GET_STATE_PATCHES,
        }),
      );

      // Resolve so the test does not hang
      backgroundStream.write({ jsonrpc: '2.0', id: 10, result: [] });
      await patchesPromise;
    });

    it('resolves with the patches from the background response', async () => {
      const { uiStream, backgroundStream } = createPatchStreamPair();
      const expectedPatches = [{ op: 'replace', path: ['foo'], value: 'bar' }];
      mockGetNextId.mockReturnValue(20);
      setupPatchStoreSubstreamConnection(uiStream, {
        handleSendUpdate: jest.fn(),
      });

      const patchesPromise = getStatePatches();
      backgroundStream.write({
        jsonrpc: '2.0',
        id: 20,
        result: expectedPatches,
      });

      const actualPatches = await patchesPromise;
      expect(actualPatches).toStrictEqual(expectedPatches);
    });

    it('rejects when the background responds with an error', async () => {
      const { uiStream, backgroundStream } = createPatchStreamPair();
      const rpcError = { code: -32000, message: 'Internal error' };
      mockGetNextId.mockReturnValue(30);
      setupPatchStoreSubstreamConnection(uiStream, {
        handleSendUpdate: jest.fn(),
      });

      const patchesPromise = getStatePatches();
      backgroundStream.write({ jsonrpc: '2.0', id: 30, error: rpcError });

      await expect(patchesPromise).rejects.toStrictEqual(rpcError);
    });

    it('does not log an error and resolves when a getStatePatches response contains a patch with not quite valid JSON (contains undefined)', async () => {
      const { uiStream, backgroundStream } = createPatchStreamPair();
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      mockGetNextId.mockReturnValue(40);
      setupPatchStoreSubstreamConnection(uiStream, {
        handleSendUpdate: jest.fn(),
      });

      const patchesPromise = getStatePatches();
      backgroundStream.write({
        jsonrpc: '2.0',
        id: 40,
        result: [{ op: 'replace', path: ['foo'], value: undefined }],
      });

      const patches = await patchesPromise;
      expect(consoleSpy).not.toHaveBeenCalled();
      expect(patches).toStrictEqual([{ op: 'replace', path: ['foo'] }]);
    });

    it('logs an error when a getStatePatches response result is not a valid patch array', async () => {
      const { uiStream, backgroundStream } = createPatchStreamPair();
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      mockGetNextId.mockReturnValue(50);
      setupPatchStoreSubstreamConnection(uiStream, {
        handleSendUpdate: jest.fn(),
      });
      const message = {
        jsonrpc: '2.0',
        id: 50,
        result: 'not-an-array',
      };

      // Do NOT await — the promise will never resolve because the result
      // is invalid and the resolver is never called.
      getStatePatches();
      backgroundStream.write(message);
      await flushBufferedWrites();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(
          /^Invalid response for patch-store stream request ID '50': /u,
        ),
        message,
      );
    });
  });
});
