import { cloneDeep } from 'lodash';
import { migrate, version } from './222';

const VERSION = version;
const OLD_VERSION = VERSION - 1;

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

describe(`migration #${VERSION}`, () => {
  it('bumps the version', async () => {
    const oldStorage: VersionedData = {
      meta: { version: OLD_VERSION },
      data: {},
    };

    const versionedData = cloneDeep(oldStorage);
    await migrate(versionedData, new Set<string>());

    expect(versionedData.meta.version).toBe(VERSION);
  });

  it('removes AccountOrderController from state', async () => {
    const oldStorage: VersionedData = {
      meta: { version: OLD_VERSION },
      data: {
        AccountOrderController: {
          pinnedAccountList: ['0xabc'],
          hiddenAccountList: ['0xdef'],
        },
        AccountTreeController: {
          accountGroupsMetadata: {},
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();
    await migrate(versionedData, changedControllers);

    expect(versionedData.data.AccountOrderController).toBeUndefined();
    expect(versionedData.data.AccountTreeController).toStrictEqual({
      accountGroupsMetadata: {},
    });
    expect(changedControllers.has('AccountOrderController')).toBe(true);
  });

  it('does nothing when AccountOrderController is absent', async () => {
    const oldStorage: VersionedData = {
      meta: { version: OLD_VERSION },
      data: {
        AccountTreeController: {
          accountGroupsMetadata: {},
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();
    await migrate(versionedData, changedControllers);

    expect(versionedData.data).toStrictEqual(oldStorage.data);
    expect(changedControllers.has('AccountOrderController')).toBe(false);
  });
});
