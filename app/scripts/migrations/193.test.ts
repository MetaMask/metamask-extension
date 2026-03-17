import { BrowserStorageAdapter } from '../lib/stores/browser-storage-adapter';
import { migrate, version } from './193';

const VERSION = version;
const oldVersion = VERSION - 1;

describe(`migration #${VERSION}`, () => {
  let mockedCaptureException: jest.Mock;

  beforeEach(() => {
    mockedCaptureException = jest.fn();
    global.sentry = { captureException: mockedCaptureException };
  });

  afterEach(() => {
    global.sentry = undefined;
  });

  it('updates the version metadata', async () => {
    const oldState = {
      meta: { version: oldVersion },
      data: {
        SnapController: {
          snaps: {},
        },
      },
    };

    await migrate(oldState, new Set());

    expect(oldState.meta.version).toBe(VERSION);
  });

  it('skips migration if SnapController is not found', async () => {
    const oldState = {
      meta: { version: oldVersion },
      data: {},
    };

    const originalData = structuredClone(oldState.data);

    await migrate(oldState, new Set());

    expect(mockedCaptureException).toHaveBeenCalledWith(
      new Error(`Migration ${version}: SnapController not found.`),
    );
    expect(oldState.data).toEqual(originalData);
  });

  it('skips migration if SnapController is not an object', async () => {
    const oldState = {
      meta: { version: oldVersion },
      data: {
        SnapController: 'not an object',
      },
    };

    const originalData = structuredClone(oldState.data);

    await migrate(oldState, new Set());

    expect(mockedCaptureException).toHaveBeenCalledWith(
      new Error(
        `Migration ${version}: SnapController is not an object: string`,
      ),
    );
    expect(oldState.data).toEqual(originalData);
  });

  it('skips migration if SnapController.snaps is not found', async () => {
    const oldState = {
      meta: { version: oldVersion },
      data: {
        SnapController: {},
      },
    };

    const originalData = structuredClone(oldState.data);

    await migrate(oldState, new Set());

    expect(mockedCaptureException).toHaveBeenCalledWith(
      new Error(`Migration ${version}: SnapController missing property snaps.`),
    );
    expect(oldState.data).toEqual(originalData);
  });

  it('skips migration if SnapController.snaps is not an object', async () => {
    const oldState = {
      meta: { version: oldVersion },
      data: {
        SnapController: { snaps: 'not an object' },
      },
    };

    const originalData = structuredClone(oldState.data);

    await migrate(oldState, new Set());

    expect(mockedCaptureException).toHaveBeenCalledWith(
      new Error(
        `Migration ${version}: SnapController.snaps is not an object: string`,
      ),
    );
    expect(oldState.data).toEqual(originalData);
  });

  it('stores the sourceCode in the browser storage and removes it from the SnapController state', async () => {
    const oldState = {
      meta: { version: oldVersion },
      data: {
        SnapController: {
          snaps: {
            'mock-snap-id': { sourceCode: 'sourceCode', id: 'mock-snap-id' },
            'foo-snap-id': { id: 'foo-snap-id', sourceCode: 'sourceCode2' },
            'bar-snap-id': { id: 'bar-snap-id', sourceCode: 'sourceCode3 ' },
          },
        },
      },
    };

    const mockSetItem = jest.fn().mockResolvedValue(undefined);

    jest
      .spyOn(BrowserStorageAdapter.prototype, 'setItem')
      .mockImplementation(mockSetItem);

    await migrate(oldState, new Set());

    expect(oldState.data).toStrictEqual({
      SnapController: {
        snaps: {
          'mock-snap-id': { id: 'mock-snap-id' },
          'foo-snap-id': { id: 'foo-snap-id' },
          'bar-snap-id': { id: 'bar-snap-id' },
        },
      },
    });

    expect(mockSetItem).toHaveBeenNthCalledWith(
      1,
      'SnapController',
      'mock-snap-id',
      {
        sourceCode: 'sourceCode',
      },
    );

    expect(mockSetItem).toHaveBeenNthCalledWith(
      2,
      'SnapController',
      'foo-snap-id',
      {
        sourceCode: 'sourceCode2',
      },
    );

    expect(mockSetItem).toHaveBeenNthCalledWith(
      3,
      'SnapController',
      'bar-snap-id',
      {
        sourceCode: 'sourceCode3 ',
      },
    );
  });
});
