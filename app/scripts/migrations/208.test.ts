import { cloneDeep } from 'lodash';
import { migrate, version } from './208';

const VERSION = version;
const OLD_VERSION = VERSION - 1;

const obsoleteAppState = {
  isRampCardClosed: true,
  nftsDetectionNoticeDismissed: true,
  showAccountBanner: false,
  showBetaHeader: true,
  showNetworkBanner: false,
  showPermissionsTour: false,
  showTestnetMessageInDropdown: false,
  surveyLinkLastClickedOrClosed: 123,
};

describe(`migration #${VERSION}`, () => {
  it('removes obsolete AppStateController properties', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        AppStateController: {
          connectedStatusPopoverHasBeenShown: true,
          ...obsoleteAppState,
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

  it('does not mark the controller changed when obsolete properties are absent', async () => {
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

  it('does nothing when AppStateController state is not an object', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        AppStateController: 'invalid state',
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
