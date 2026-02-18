import { cloneDeep } from 'lodash';
import { migrate, version } from './196';

const VERSION = version;
const OLD_VERSION = VERSION - 1;

describe(`migration #${VERSION}`, () => {
  let mockedCaptureException: jest.Mock;

  beforeEach(() => {
    mockedCaptureException = jest.fn();
    global.sentry = { captureException: mockedCaptureException };
  });

  afterEach(() => {
    global.sentry = undefined;
  });

  it('DOES NOT modify the controller + exception if NetworkEnablementController is missing', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        OtherRandomController: {},
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.meta.version).toBe(VERSION);
    expect(versionedData.data).toStrictEqual({
      OtherRandomController: {},
    });
    expect(changedControllers).toStrictEqual(new Set([]));
    expect(mockedCaptureException).toHaveBeenCalledWith(
      new Error(`Migration ${VERSION}: NetworkEnablementController not found.`),
    );
  });

  it('DOES NOT modify the controller + exception if NetworkEnablementController has changed type', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        NetworkEnablementController: [
          {
            foo: 'bar',
          },
        ],
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.meta.version).toBe(VERSION);
    expect(versionedData.data).toStrictEqual({
      NetworkEnablementController: [
        {
          foo: 'bar',
        },
      ],
    });
    expect(changedControllers).toStrictEqual(new Set([]));
    expect(mockedCaptureException).toHaveBeenCalledWith(
      new Error(
        `Migration ${VERSION}: NetworkEnablementController is not an object: object`,
      ),
    );
  });

  it('DOES NOT modify the controller + exception if NetworkEnablementController.nativeAssetIdentifiers is missing', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        NetworkEnablementController: {
          anotherFieldThatIsNotNativeAssetIdentifiers: {},
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.meta.version).toBe(VERSION);
    expect(versionedData.data).toStrictEqual({
      NetworkEnablementController: {
        anotherFieldThatIsNotNativeAssetIdentifiers: {},
      },
    });
    expect(changedControllers).toStrictEqual(new Set([]));
    expect(mockedCaptureException).toHaveBeenCalledWith(
      new Error(
        `Migration ${VERSION}: NetworkEnablementController missing property nativeAssetIdentifiers.`,
      ),
    );
  });

  it('DOES NOT modify the controller + exception if NetworkEnablementController.nativeAssetIdentifiers has changed type', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        NetworkEnablementController: {
          // Not the correct type, should be an object.
          nativeAssetIdentifiers: [
            'eip155:1/slip44:60',
            'eip155:999/slip44:2457',
          ],
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.meta.version).toBe(VERSION);
    expect(versionedData.data).toStrictEqual({
      NetworkEnablementController: {
        nativeAssetIdentifiers: [
          'eip155:1/slip44:60',
          'eip155:999/slip44:2457',
        ],
      },
    });
    expect(changedControllers).toStrictEqual(new Set([]));
    expect(mockedCaptureException).toHaveBeenCalledWith(
      new Error(
        `Migration ${VERSION}: NetworkEnablementController.nativeAssetIdentifiers is not an object: object.`,
      ),
    );
  });

  it('DOES NOT modify the controller if a HYPE entry with correct value already exists', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        NetworkEnablementController: {
          nativeAssetIdentifiers: {
            'eip155:1': 'eip155:1/slip44:60',
            'eip155:999': 'eip155:999/slip44:2457',
          },
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.meta.version).toBe(VERSION);
    expect(versionedData.data).toStrictEqual({
      NetworkEnablementController: {
        nativeAssetIdentifiers: {
          'eip155:1': 'eip155:1/slip44:60',
          'eip155:999': 'eip155:999/slip44:2457',
        },
      },
    });
    expect(changedControllers).toStrictEqual(new Set([]));
  });

  it('DOES NOT modify the controller if no HYPE entry already exist', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        NetworkEnablementController: {
          nativeAssetIdentifiers: {
            'eip155:1': 'eip155:1/slip44:60',
          },
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.meta.version).toBe(VERSION);
    expect(versionedData.data).toStrictEqual({
      NetworkEnablementController: {
        nativeAssetIdentifiers: {
          'eip155:1': 'eip155:1/slip44:60',
        },
      },
    });
    expect(changedControllers).toStrictEqual(new Set([]));
  });

  it('SUCCESSFULY transforms incorrect HYPE slip44 value to correct value', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        NetworkEnablementController: {
          nativeAssetIdentifiers: {
            'eip155:1': 'eip155:1/slip44:60',
            'eip155:999': 'eip155:999/slip44:1',
          },
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.meta.version).toBe(VERSION);
    expect(versionedData.data).toStrictEqual({
      NetworkEnablementController: {
        nativeAssetIdentifiers: {
          'eip155:1': 'eip155:1/slip44:60',
          'eip155:999': 'eip155:999/slip44:2457',
        },
      },
    });
    expect(changedControllers).toStrictEqual(
      new Set(['NetworkEnablementController']),
    );
  });
});
