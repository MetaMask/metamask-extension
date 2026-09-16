import { cloneDeep } from 'lodash';
import { migrate, version } from './227';

const VERSION = version;
const OLD_VERSION = VERSION - 1;

describe(`migration #${VERSION}`, () => {
  it('removes hiddenAccountList from AccountOrderController', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        AccountOrderController: {
          pinnedAccountList: ['0xabc'],
          hiddenAccountList: ['0xdef'],
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
        AccountOrderController: {
          pinnedAccountList: ['0xabc'],
        },
        OtherController: { preserved: true },
      },
    });
    expect(changedControllers).toStrictEqual(
      new Set(['AccountOrderController']),
    );
  });

  it('does not mark AccountOrderController changed when hiddenAccountList is absent', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        AccountOrderController: {
          pinnedAccountList: ['0xabc'],
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

  it('does nothing when AccountOrderController is missing', async () => {
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
