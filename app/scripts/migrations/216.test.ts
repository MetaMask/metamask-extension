import { cloneDeep } from 'lodash';
import { migrate, version } from './216';

const VERSION = version;
const OLD_VERSION = VERSION - 1;

describe(`migration #${VERSION}`, () => {
  it('removes importTokensModalOpen from AppStateController', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        AppStateController: {
          importTokensModalOpen: true,
          connectedStatusPopoverHasBeenShown: true,
        },
      },
    };
    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData).toStrictEqual({
      meta: { version: VERSION },
      data: {
        AppStateController: {
          connectedStatusPopoverHasBeenShown: true,
        },
      },
    });
    expect(changedControllers).toStrictEqual(new Set(['AppStateController']));
  });

  it('does not mark AppStateController changed when importTokensModalOpen is absent', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        AppStateController: {
          connectedStatusPopoverHasBeenShown: true,
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

  it('does nothing when AppStateController is missing', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        PreferencesController: {},
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
