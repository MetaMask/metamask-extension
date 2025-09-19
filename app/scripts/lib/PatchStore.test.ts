import { Patch } from 'immer';
import ComposableObservableStore from './ComposableObservableStore';
import { PatchStore } from './PatchStore';
import { sanitizePatches, sanitizeUIState } from './state-utils';

jest.mock('./state-utils');

function createComposableStoreMock() {
  return {
    on: jest.fn(),
    removeListener: jest.fn(),
  } as unknown as jest.Mocked<ComposableObservableStore>;
}

function triggerStateChange(
  composableStoreMock: jest.Mocked<ComposableObservableStore>,
  oldState: Record<string, unknown>,
  newState: Record<string, unknown>,
  patches?: Patch[],
) {
  composableStoreMock.on.mock.calls[0][1]({
    controllerKey: 'test-controller',
    newState,
    oldState,
    patches,
  });
}

describe('PatchStore', () => {
  const sanitizeUIStateMock = jest.mocked(sanitizeUIState);
  const sanitizePatchesMock = jest.mocked(sanitizePatches);

  beforeEach(() => {
    jest.resetAllMocks();
    sanitizeUIStateMock.mockImplementation((state) => state);
    sanitizePatchesMock.mockImplementation((patches) => patches);
  });

  describe('flushPendingPatches', () => {
    it('returns top level patches for composable store events', () => {
      const composableStoreMock = createComposableStoreMock();
      const patchStore = new PatchStore(composableStoreMock);

      triggerStateChange(
        composableStoreMock,
        { test1: 'value1' },
        { test1: 'value2' },
      );

      triggerStateChange(
        composableStoreMock,
        { test2: true },
        { test2: false },
      );

      const patches = patchStore.flushPendingPatches();

      expect(patches).toEqual([
        {
          op: 'replace',
          path: ['test1'],
          value: 'value2',
        },
        {
          op: 'replace',
          path: ['test2'],
          value: false,
        },
      ]);
    });

    it('ignores state properties if old and new state is shallow equal', () => {
      const objectMock = {};
      const composableStoreMock = createComposableStoreMock();
      const patchStore = new PatchStore(composableStoreMock);

      triggerStateChange(
        composableStoreMock,
        { test1: 'value1' },
        { test1: 'value1' },
      );

      triggerStateChange(
        composableStoreMock,
        { test2: objectMock },
        { test2: objectMock },
      );

      triggerStateChange(
        composableStoreMock,
        { test3: { test: 'value' } },
        { test3: { test: 'value' } },
      );

      const patches = patchStore.flushPendingPatches();

      expect(patches).toEqual([
        {
          op: 'replace',
          path: ['test3'],
          value: { test: 'value' },
        },
      ]);
    });

    it('returns empty array if no composable store events', () => {
      const composableStoreMock = createComposableStoreMock();
      const patchStore = new PatchStore(composableStoreMock);

      const patches = patchStore.flushPendingPatches();

      expect(patches).toEqual([]);
    });

    it('clears pending patches', () => {
      const composableStoreMock = createComposableStoreMock();
      const patchStore = new PatchStore(composableStoreMock);

      triggerStateChange(
        composableStoreMock,
        { test1: 'value1' },
        { test1: 'value2' },
      );

      const patches1 = patchStore.flushPendingPatches();
      const patches2 = patchStore.flushPendingPatches();

      expect(patches1).toHaveLength(1);
      expect(patches2).toHaveLength(0);
    });

    it('sanitizes state in patches', () => {
      const composableStoreMock = createComposableStoreMock();
      const patchStore = new PatchStore(composableStoreMock);

      sanitizeUIStateMock.mockReturnValueOnce({ test2: 'value' });

      triggerStateChange(
        composableStoreMock,
        { test1: false },
        { test1: true },
      );

      const patches = patchStore.flushPendingPatches();

      expect(patches).toEqual([
        {
          op: 'replace',
          path: ['test2'],
          value: 'value',
        },
      ]);
    });

    it('adds isInitialized patch if vault in new state', () => {
      const composableStoreMock = createComposableStoreMock();
      const patchStore = new PatchStore(composableStoreMock);

      triggerStateChange(composableStoreMock, { vault: 0 }, { vault: 123 });

      const patches = patchStore.flushPendingPatches();

      expect(patches).toEqual([
        {
          op: 'replace',
          path: ['vault'],
          value: 123,
        },
        {
          op: 'replace',
          path: ['isInitialized'],
          value: true,
        },
      ]);
    });

    it('returns patches from composable store events if provided', () => {
      const composableStoreMock = createComposableStoreMock();
      const patchStore = new PatchStore(composableStoreMock);

      triggerStateChange(
        composableStoreMock,
        { test1: 'value1' },
        { test1: 'value2' },
        [
          {
            op: 'add',
            path: ['test3'],
            value: 'value3',
          },
          {
            op: 'remove',
            path: ['test4'],
            value: 'value4',
          },
        ],
      );

      triggerStateChange(
        composableStoreMock,
        { test2: true },
        { test2: false },
      );

      const patches = patchStore.flushPendingPatches();

      expect(patches).toEqual([
        {
          op: 'add',
          path: ['test3'],
          value: 'value3',
        },
        {
          op: 'remove',
          path: ['test4'],
          value: 'value4',
        },
        {
          op: 'replace',
          path: ['test2'],
          value: false,
        },
      ]);
    });

    it('sanitizes patches if provided on event', () => {
      sanitizePatchesMock.mockReturnValue([
        {
          op: 'add',
          path: ['test5'],
          value: 'value5',
        },
      ]);

      const composableStoreMock = createComposableStoreMock();
      const patchStore = new PatchStore(composableStoreMock);

      triggerStateChange(
        composableStoreMock,
        { test1: 'value1' },
        { test1: 'value2' },
        [
          {
            op: 'add',
            path: ['test3'],
            value: 'value3',
          },
          {
            op: 'remove',
            path: ['test4'],
            value: 'value4',
          },
        ],
      );

      const patches = patchStore.flushPendingPatches();

      expect(patches).toEqual([
        {
          op: 'add',
          path: ['test5'],
          value: 'value5',
        },
      ]);
    });

    it('generates multiple patches if patch has no path', () => {
      const composableStoreMock = createComposableStoreMock();
      const patchStore = new PatchStore(composableStoreMock);

      triggerStateChange(
        composableStoreMock,
        { test1: 'value1' },
        { test1: 'value2' },
        [
          {
            op: 'replace',
            path: [],
            value: {
              test1: 'value1',
              test2: { test3: 'value2' },
            },
          },
        ],
      );

      const patches = patchStore.flushPendingPatches();

      expect(patches).toEqual([
        {
          op: 'replace',
          path: ['test1'],
          value: 'value1',
        },
        {
          op: 'replace',
          path: ['test2'],
          value: { test3: 'value2' },
        },
      ]);
    });
  });

  describe('destroy', () => {
    it('removes listener from composable store', () => {
      const composableStoreMock = createComposableStoreMock();
      const patchStore = new PatchStore(composableStoreMock);

      patchStore.destroy();

      expect(composableStoreMock.removeListener).toHaveBeenCalledTimes(1);
    });
  });
});
