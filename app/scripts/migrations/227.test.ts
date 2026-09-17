import { cloneDeep } from 'lodash';
import { migrate, version } from './227';

const VERSION = version;
const OLD_VERSION = VERSION - 1;

describe(`migration #${VERSION}`, () => {
  it('removes AccountOrderController', async () => {
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
        OtherController: { preserved: true },
      },
    });
    expect(changedControllers).toStrictEqual(
      new Set(['AccountOrderController']),
    );
  });

  it('does not mark AccountOrderController changed when it is absent', async () => {
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
