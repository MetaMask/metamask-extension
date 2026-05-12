import { cloneDeep } from 'lodash';
import { migrate, version } from './208';

const VERSION = version;
const OLD_VERSION = VERSION - 1;

const OBSOLETE_APP_STATE = {
  isRampCardClosed: true,
  nftsDetectionNoticeDismissed: true,
  showAccountBanner: false,
  showBetaHeader: true,
  showNetworkBanner: false,
  showPermissionsTour: false,
  showTestnetMessageInDropdown: false,
  surveyLinkLastClickedOrClosed: 123,
};

const OBSOLETE_UI_APP_STATE = {
  accountDetailsAddress: '0x123',
  buyView: {},
  currentWindowTab: {},
  menuOpen: true,
  networksTabSelectedRpcUrl: 'https://rpc.example.com',
  newNftAddedMessage: 'NFT added',
  removeNftMessage: 'NFT removed',
  scrollToBottom: true,
  shouldClose: true,
  showCopyAddressToast: true,
  showNewSrpAddedToast: 1,
  showNftDetectionEnablementToast: true,
  showPasswordChangeToast: 'success',
  showTermsOfUsePopup: true,
  snapsInstallPrivacyWarningShown: true,
  welcomeScreenSeen: true,
};

describe(`migration #${VERSION}`, () => {
  it('removes obsolete AppStateController properties', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        AppStateController: {
          connectedStatusPopoverHasBeenShown: true,
          ...OBSOLETE_APP_STATE,
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

  it('removes obsolete UI app state properties from persisted monolithic state', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        AppStateController: {
          connectedStatusPopoverHasBeenShown: true,
        },
        appState: {
          customNonceValue: '',
          ...OBSOLETE_UI_APP_STATE,
        },
        metamask: {
          isInitialized: true,
          ...OBSOLETE_UI_APP_STATE,
        },
        customNonceValue: '',
        ...OBSOLETE_UI_APP_STATE,
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
        appState: {
          customNonceValue: '',
        },
        metamask: {
          isInitialized: true,
        },
        customNonceValue: '',
      },
    });
    expect(changedControllers).toStrictEqual(new Set(['appState', 'metamask']));
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
});
