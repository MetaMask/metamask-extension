import ObjectMultiplex from '@metamask/object-multiplex';
import { is } from '@metamask/superstruct';

import { GET_STATE_PATCHES, SEND_UPDATE } from '../../shared/constants/patches';
import * as randomId from '../../shared/modules/random-id';
import { withResolvers } from '../../shared/lib/promise-with-resolvers';
import { flushPromises } from '../../test/lib/timer-helpers';
import { updateMetamaskState } from './actions';
import {
  getStatePatches,
  PatchesStruct,
  setupPatchStoreSubstreamConnection,
} from './patch-substream-connection';
import configureStore, { Store } from './store';

jest.mock('./actions', () => ({
  updateMetamaskState: jest.fn((patches) => ({
    type: 'UPDATE_METAMASK_STATE',
    patches,
  })),
}));

jest.mock('../../shared/modules/random-id');

const mockGetNextId = jest.mocked(randomId.default);

/**
 * Creates a pair of connected patch-store substreams using real ObjectMultiplex
 * instances piped together, matching the background ↔ UI stream topology.
 *
 * Returns:
 * - `uiStream`: the stream to pass to `setupPatchStoreSubstreamConnection`
 * - `backgroundStream`: the stream tests write to, simulating messages from
 *   the background process
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
 * Creates a deferred store promise pair for use in tests.
 */
function createStorePromise(): PromiseWithResolvers<Store> {
  return withResolvers<Store>();
}

/**
 * Wraps a microtask flush to reframe why we are using it: stream writes through
 * ObjectMultiplex are buffered and delivered asynchronously, so tests must
 * await this after writing to a stream before asserting on the outcome.
 */
async function flushBufferedWrites() {
  await flushPromises();
}

describe('patch-substream-connection', () => {
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
      it('dispatches updateMetamaskState with the received patches', async () => {
        const { uiStream, backgroundStream } = createPatchStreamPair();
        const storePromise = createStorePromise();
        const store = configureStore({});
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const patches = [{ op: 'replace' as const, path: ['y'], value: 2 }];
        setupPatchStoreSubstreamConnection(uiStream, storePromise);
        storePromise.resolve(store);

        backgroundStream.write({
          jsonrpc: '2.0',
          method: SEND_UPDATE,
          params: [patches],
        });
        await flushBufferedWrites();

        expect(updateMetamaskState).toHaveBeenCalledWith(patches);
        expect(dispatchSpy).toHaveBeenCalledWith(updateMetamaskState(patches));
      });

      it('waits for the Redux store to be ready before dispatching', async () => {
        const { uiStream, backgroundStream } = createPatchStreamPair();
        const storePromise = createStorePromise();
        const store = configureStore({});
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const patches = [{ op: 'replace' as const, path: ['z'], value: 3 }];
        setupPatchStoreSubstreamConnection(uiStream, storePromise);

        backgroundStream.write({
          jsonrpc: '2.0',
          method: SEND_UPDATE,
          params: [patches],
        });
        // Store not yet resolved — dispatch has not been called
        await flushBufferedWrites();
        expect(dispatchSpy).not.toHaveBeenCalled();

        // Now resolve the store
        storePromise.resolve(store);
        await flushBufferedWrites();
        expect(dispatchSpy).toHaveBeenCalledWith(updateMetamaskState(patches));
      });
    });

    describe('when a notification is received with an unknown method', () => {
      it('logs an error', async () => {
        const { uiStream, backgroundStream } = createPatchStreamPair();
        const storePromise = createStorePromise();
        const consoleSpy = jest
          .spyOn(console, 'error')
          .mockImplementation(() => undefined);
        setupPatchStoreSubstreamConnection(uiStream, storePromise);
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
      const storePromise = createStorePromise();
      const sentMessages: unknown[] = [];
      backgroundStream.on('data', (msg) => sentMessages.push(msg));
      mockGetNextId.mockReturnValue(10);
      setupPatchStoreSubstreamConnection(uiStream, storePromise);

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
      const storePromise = createStorePromise();
      const expectedPatches = [{ op: 'replace', path: ['foo'], value: 'bar' }];
      mockGetNextId.mockReturnValue(20);
      setupPatchStoreSubstreamConnection(uiStream, storePromise);

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
      const storePromise = createStorePromise();
      const rpcError = { code: -32000, message: 'Internal error' };
      mockGetNextId.mockReturnValue(30);
      setupPatchStoreSubstreamConnection(uiStream, storePromise);

      const patchesPromise = getStatePatches();
      backgroundStream.write({ jsonrpc: '2.0', id: 30, error: rpcError });

      await expect(patchesPromise).rejects.toStrictEqual(rpcError);
    });

    it('logs an error when a getStatePatches response result is not a valid patch array', async () => {
      const { uiStream, backgroundStream } = createPatchStreamPair();
      const storePromise = createStorePromise();
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      mockGetNextId.mockReturnValue(50);
      setupPatchStoreSubstreamConnection(uiStream, storePromise);
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
