import { cloneDeep } from 'lodash';
import { migrate, version } from './224';

const VERSION = version;
const OLD_VERSION = VERSION - 1;

describe(`migration #${VERSION}`, () => {
  it('removes rawRemoteFeatureFlags from RemoteFeatureFlagController', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        RemoteFeatureFlagController: {
          remoteFeatureFlags: { addBitcoinAccountDummyFlag: true },
          rawRemoteFeatureFlags: { addBitcoinAccountDummyFlag: true },
          cacheTimestamp: 123,
        },
        OtherController: { preserved: true },
      },
    };
    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData).toStrictEqual({
      meta: { version: VERSION },
      data: {
        RemoteFeatureFlagController: {
          remoteFeatureFlags: { addBitcoinAccountDummyFlag: true },
          cacheTimestamp: 123,
        },
        OtherController: { preserved: true },
      },
    });
    expect(changedControllers).toStrictEqual(
      new Set(['RemoteFeatureFlagController']),
    );
  });

  it('does not mark RemoteFeatureFlagController changed when rawRemoteFeatureFlags is absent', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        RemoteFeatureFlagController: {
          remoteFeatureFlags: {},
          cacheTimestamp: 0,
        },
      },
    };
    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData).toStrictEqual({
      meta: { version: VERSION },
      data: oldStorage.data,
    });
    expect(changedControllers).toStrictEqual(new Set([]));
  });

  it('does nothing when RemoteFeatureFlagController is missing', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        AppStateController: {},
      },
    };
    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData).toStrictEqual({
      meta: { version: VERSION },
      data: oldStorage.data,
    });
    expect(changedControllers).toStrictEqual(new Set([]));
  });
});
