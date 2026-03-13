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
    describe('when a sendUpdate notification is received', () => {
      it('calls handleSendUpdate with the received notification', async () => {
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
    });

    describe('when a notification is received with an unknown method', () => {
      it('logs an error', async () => {
        const { uiStream, backgroundStream } = createPatchStreamPair();
        const consoleSpy = jest
          .spyOn(console, 'error')
          .mockImplementation(() => undefined);
        setupPatchStoreSubstreamConnection(uiStream, { handleSendUpdate: jest.fn() });
        const message = {
          id: 9999,
          jsonrpc: '2.0',
          method: 'unknown',
          result: [],
        };

        backgroundStream.write(message);
        await flushBufferedWrites();

        expect(consoleSpy).toHaveBeenCalledWith(
          'Invalid patch-store substream message',
          message,
        );
      });
    });
  });

  describe('getStatePatches', () => {
    it('writes a getStatePatches JSON-RPC request to the substream', async () => {
      const { uiStream, backgroundStream } = createPatchStreamPair();
      const sentMessages: unknown[] = [];
      backgroundStream.on('data', (msg) => sentMessages.push(msg));
      mockGetNextId.mockReturnValue(10);
      setupPatchStoreSubstreamConnection(uiStream, { handleSendUpdate: jest.fn() });

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
      setupPatchStoreSubstreamConnection(uiStream, { handleSendUpdate: jest.fn() });

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
      setupPatchStoreSubstreamConnection(uiStream, { handleSendUpdate: jest.fn() });

      const patchesPromise = getStatePatches();
      backgroundStream.write({ jsonrpc: '2.0', id: 30, error: rpcError });

      await expect(patchesPromise).rejects.toStrictEqual(rpcError);
    });

    it('logs an error when a getStatePatches response result is not a valid patch array', async () => {
      const { uiStream, backgroundStream } = createPatchStreamPair();
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      mockGetNextId.mockReturnValue(50);
      setupPatchStoreSubstreamConnection(uiStream, { handleSendUpdate: jest.fn() });
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
        "Invalid response for patch-store stream request ID '50'",
        message,
      );
    });
  });
});
