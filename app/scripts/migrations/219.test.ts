import migrate, { version } from './219';

const PPOM_DB_NAME = 'PPOMDB';

describe(`migration #${version}`, () => {
  let deleteDbMock: jest.Mock;

  beforeEach(() => {
    deleteDbMock = jest.fn().mockReturnValue({
      set onsuccess(handler: () => void) {
        handler();
      },
      set onerror(_handler: () => void) {},
      set onblocked(_handler: () => void) {},
    });

    Object.defineProperty(globalThis, 'indexedDB', {
      value: { deleteDatabase: deleteDbMock },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    // @ts-expect-error Cleaning up global mock
    delete globalThis.indexedDB;
  });

  it('bumps the state version', async () => {
    const state = { meta: { version: version - 1 }, data: {} };
    await migrate(state, new Set());
    expect(state.meta.version).toBe(version);
  });

  it('removes PPOMController from state', async () => {
    const state = {
      meta: { version: version - 1 },
      data: {
        PPOMController: {
          versionInfo: [{ name: 'blob', chainId: '0x1' }],
          storageMetadata: [],
        },
        OtherController: { kept: true },
      },
    };
    const changedKeys = new Set<string>();
    await migrate(state, changedKeys);

    expect(state.data.PPOMController).toBeUndefined();
    expect(state.data.OtherController).toStrictEqual({ kept: true });
    expect(changedKeys).toStrictEqual(new Set(['PPOMController']));
  });

  it('is a no-op for state when PPOMController is absent', async () => {
    const state = {
      meta: { version: version - 1 },
      data: { OtherController: { kept: true } },
    };
    const changedKeys = new Set<string>();
    await migrate(state, changedKeys);

    expect(state.data).toStrictEqual({ OtherController: { kept: true } });
    expect(changedKeys.size).toBe(0);
  });

  it('deletes the PPOMDB IndexedDB database', async () => {
    const state = { meta: { version: version - 1 }, data: {} };
    await migrate(state, new Set());

    expect(deleteDbMock).toHaveBeenCalledWith(PPOM_DB_NAME);
  });

  it('does not throw when IndexedDB deletion fails', async () => {
    deleteDbMock.mockReturnValue({
      set onsuccess(_handler: () => void) {},
      set onerror(handler: () => void) {
        handler();
      },
      set onblocked(_handler: () => void) {},
    });

    const state = {
      meta: { version: version - 1 },
      data: { PPOMController: {} },
    };
    const changedKeys = new Set<string>();

    await expect(migrate(state, changedKeys)).resolves.toBeUndefined();
    expect(state.data.PPOMController).toBeUndefined();
    expect(changedKeys).toStrictEqual(new Set(['PPOMController']));
  });

  it('does not throw when IndexedDB deletion is blocked', async () => {
    deleteDbMock.mockReturnValue({
      set onsuccess(_handler: () => void) {},
      set onerror(_handler: () => void) {},
      set onblocked(handler: () => void) {
        handler();
      },
    });

    const state = { meta: { version: version - 1 }, data: {} };

    await expect(migrate(state, new Set())).resolves.toBeUndefined();
  });

  it('does not throw when indexedDB is unavailable', async () => {
    // @ts-expect-error Simulating missing indexedDB
    delete globalThis.indexedDB;

    const state = {
      meta: { version: version - 1 },
      data: { PPOMController: { storageMetadata: [] } },
    };
    const changedKeys = new Set<string>();

    await expect(migrate(state, changedKeys)).resolves.toBeUndefined();
    expect(state.data.PPOMController).toBeUndefined();
    expect(changedKeys).toStrictEqual(new Set(['PPOMController']));
  });
});
