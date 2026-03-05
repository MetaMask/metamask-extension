import { cloneDeep } from 'lodash';

// eslint-disable-next-line import/first
import { migrate, version, type VersionedData } from './198';

const VERSION = version;
const oldVersion = VERSION - 1;

const oldStorageWithLegacyKeys: VersionedData = {
  meta: { version: oldVersion },
  data: {
    GatorPermissionsController: {
      gatorPermissionsMapSerialized: 'foo',
      isGatorPermissionsEnabled: true,
      gatorPermissionsProviderSnapId: 'bar',
      pendingRevocations: [],
    },
  },
};

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
    const storage = cloneDeep(oldStorageWithLegacyKeys);
    const localChangedControllers = new Set<string>();

    await migrate(storage, localChangedControllers);

    expect(storage.meta).toStrictEqual({ version: VERSION });
  });

  it('removes the legacy v1 keys and reports GatorPermissionsController as changed', async () => {
    const storage = cloneDeep(oldStorageWithLegacyKeys);
    const localChangedControllers = new Set<string>();

    await migrate(storage, localChangedControllers);

    expect(storage.meta.version).toStrictEqual(VERSION);

    const gatorPermissionsControllerMigratedState =
      storage.data.GatorPermissionsController;
    expect(gatorPermissionsControllerMigratedState).toStrictEqual({
      pendingRevocations: [],
    });

    expect(localChangedControllers).toStrictEqual(
      new Set(['GatorPermissionsController']),
    );
  });

  it('does not add to changed controllers when GatorPermissionsController is not present', async () => {
    const storage: VersionedData = {
      meta: { version: oldVersion },
      data: {
        SomeOtherController: {},
      },
    };
    const localChangedControllers = new Set<string>();

    await migrate(storage, localChangedControllers);

    expect(storage.meta.version).toStrictEqual(VERSION);
    expect(localChangedControllers.size).toBe(0);
    expect(mockedCaptureException).not.toHaveBeenCalled();
  });

  it('successfully migrates even if individual legacy keys are missing', async () => {
    const storage: VersionedData = {
      meta: { version: oldVersion },
      data: {
        GatorPermissionsController: {
          pendingRevocations: [],
        },
      },
    };
    const localChangedControllers = new Set<string>();

    await migrate(storage, localChangedControllers);

    expect(storage.meta.version).toStrictEqual(VERSION);

    const gatorPermissionsControllerMigratedState =
      storage.data.GatorPermissionsController;
    expect(gatorPermissionsControllerMigratedState).toStrictEqual({
      pendingRevocations: [],
    });
    expect(localChangedControllers).toStrictEqual(
      new Set(['GatorPermissionsController']),
    );
  });
});
