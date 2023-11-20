import { ObservableStore } from '@metamask/obs-store';
import { ORIGIN_METAMASK } from '../../../shared/constants/app';
import AppStateController from './app-state';

let appStateController, mockStore;

describe('AppStateController', () => {
  mockStore = new ObservableStore();
  const createAppStateController = (initState = {}) => {
    return new AppStateController({
      addUnlockListener: jest.fn(),
      isUnlocked: jest.fn(() => true),
      initState,
      onInactiveTimeout: jest.fn(),
      showUnlockRequest: jest.fn(),
      preferencesStore: {
        subscribe: jest.fn(),
        getState: jest.fn(() => ({
          preferences: {
            autoLockTimeLimit: 0,
          },
        })),
      },
      messenger: {
        call: jest.fn(() => ({
          catch: jest.fn(),
        })),
        subscribe: jest.fn(),
      },
    });
  };

  beforeEach(() => {
    appStateController = createAppStateController({ store: mockStore });
  });

  describe('setOutdatedBrowserWarningLastShown', () => {
    it('sets the last shown time', () => {
      appStateController = createAppStateController();
      const date = new Date();

      appStateController.setOutdatedBrowserWarningLastShown(date);

      expect(
        appStateController.store.getState().outdatedBrowserWarningLastShown,
      ).toStrictEqual(date);
    });

    it('sets outdated browser warning last shown timestamp', () => {
      const lastShownTimestamp = Date.now();
      appStateController = createAppStateController();
      const updateStateSpy = jest.spyOn(
        appStateController.store,
        'updateState',
      );

      appStateController.setOutdatedBrowserWarningLastShown(lastShownTimestamp);

      expect(updateStateSpy).toHaveBeenCalledTimes(1);
      expect(updateStateSpy).toHaveBeenCalledWith({
        outdatedBrowserWarningLastShown: lastShownTimestamp,
      });

      updateStateSpy.mockRestore();
    });
  });

  describe('getUnlockPromise', () => {
    it('waits for unlock if the extension is locked', async () => {
      appStateController = createAppStateController();
      const isUnlockedMock = jest
        .spyOn(appStateController, 'isUnlocked')
        .mockReturnValue(false);
      const waitForUnlockSpy = jest.spyOn(appStateController, 'waitForUnlock');

      appStateController.getUnlockPromise(true);
      expect(isUnlockedMock).toHaveBeenCalled();
      expect(waitForUnlockSpy).toHaveBeenCalledWith(expect.any(Function), true);
    });

    it('resolves immediately if the extension is already unlocked', async () => {
      appStateController = createAppStateController();
      const isUnlockedMock = jest
        .spyOn(appStateController, 'isUnlocked')
        .mockReturnValue(true);

      await expect(
        appStateController.getUnlockPromise(false),
      ).resolves.toBeUndefined();

      expect(isUnlockedMock).toHaveBeenCalled();
    });
  });

  describe('waitForUnlock', () => {
    it('resolves immediately if already unlocked', async () => {
      const emitSpy = jest.spyOn(appStateController, 'emit');
      const resolveFn = jest.fn();
      appStateController.waitForUnlock(resolveFn, false);
      expect(emitSpy).toHaveBeenCalledWith('updateBadge');
      expect(appStateController.messagingSystem.call).toHaveBeenCalledTimes(0);
    });

    it('creates approval request when waitForUnlock is called with shouldShowUnlockRequest as true', async () => {
      jest.spyOn(appStateController, 'isUnlocked').mockReturnValue(false);

      const resolveFn = jest.fn();
      appStateController.waitForUnlock(resolveFn, true);

      expect(appStateController.messagingSystem.call).toHaveBeenCalledTimes(1);
      expect(appStateController.messagingSystem.call).toHaveBeenCalledWith(
        'ApprovalController:addRequest',
        expect.objectContaining({
          id: expect.any(String),
          origin: ORIGIN_METAMASK,
          type: 'unlock',
        }),
        true,
      );
    });
  });

  describe('handleUnlock', () => {
    beforeEach(() => {
      jest.spyOn(appStateController, 'isUnlocked').mockReturnValue(false);
    });
    afterEach(() => {
      jest.clearAllMocks();
    });
    it('accepts approval request revolving all the related promises', async () => {
      const emitSpy = jest.spyOn(appStateController, 'emit');
      const resolveFn = jest.fn();
      appStateController.waitForUnlock(resolveFn, true);

      appStateController.handleUnlock();

      expect(emitSpy).toHaveBeenCalled();
      expect(emitSpy).toHaveBeenCalledWith('updateBadge');
      expect(appStateController.messagingSystem.call).toHaveBeenCalled();
      expect(appStateController.messagingSystem.call).toHaveBeenCalledWith(
        'ApprovalController:acceptRequest',
        expect.any(String),
      );
    });
  });

  describe('setDefaultHomeActiveTabName', () => {
    it('sets the default home tab name', () => {
      appStateController.setDefaultHomeActiveTabName('testTabName');
      expect(appStateController.store.getState().defaultHomeActiveTabName).toBe(
        'testTabName',
      );
    });
  });

  describe('setConnectedStatusPopoverHasBeenShown', () => {
    it('sets connected status popover as shown', () => {
      appStateController.setConnectedStatusPopoverHasBeenShown();
      expect(
        appStateController.store.getState().connectedStatusPopoverHasBeenShown,
      ).toBe(true);
    });
  });

  describe('setRecoveryPhraseReminderHasBeenShown', () => {
    it('sets recovery phrase reminder as shown', () => {
      appStateController.setRecoveryPhraseReminderHasBeenShown();
      expect(
        appStateController.store.getState().recoveryPhraseReminderHasBeenShown,
      ).toBe(true);
    });
  });

  describe('setRecoveryPhraseReminderLastShown', () => {
    it('sets the last shown time of recovery phrase reminder', () => {
      const timestamp = Date.now();
      appStateController.setRecoveryPhraseReminderLastShown(timestamp);

      expect(
        appStateController.store.getState().recoveryPhraseReminderLastShown,
      ).toBe(timestamp);
    });
  });

  describe('setLastActiveTime', () => {
    it('sets the last active time to the current time', () => {
      const spy = jest.spyOn(appStateController, '_resetTimer');
      appStateController.setLastActiveTime();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('setBrowserEnvironment', () => {
    it('sets the current browser and OS environment', () => {
      appStateController.setBrowserEnvironment('Windows', 'Chrome');
      expect(
        appStateController.store.getState().browserEnvironment,
      ).toStrictEqual({
        os: 'Windows',
        browser: 'Chrome',
      });
    });
  });

  describe('addPollingToken', () => {
    it('adds a pollingToken for a given environmentType', () => {
      const pollingTokenType = 'popupGasPollTokens';
      appStateController.addPollingToken('token1', pollingTokenType);
      expect(appStateController.store.getState()[pollingTokenType]).toContain(
        'token1',
      );
    });
  });

  describe('removePollingToken', () => {
    it('removes a pollingToken for a given environmentType', () => {
      const pollingTokenType = 'popupGasPollTokens';
      appStateController.addPollingToken('token1', pollingTokenType);
      appStateController.removePollingToken('token1', pollingTokenType);
      expect(
        appStateController.store.getState()[pollingTokenType],
      ).not.toContain('token1');
    });
  });

  describe('clearPollingTokens', () => {
    it('clears all pollingTokens', () => {
      appStateController.addPollingToken('token1', 'popupGasPollTokens');
      appStateController.addPollingToken('token2', 'notificationGasPollTokens');
      appStateController.addPollingToken('token3', 'fullScreenGasPollTokens');
      appStateController.clearPollingTokens();

      expect(
        appStateController.store.getState().popupGasPollTokens,
      ).toStrictEqual([]);
      expect(
        appStateController.store.getState().notificationGasPollTokens,
      ).toStrictEqual([]);
      expect(
        appStateController.store.getState().fullScreenGasPollTokens,
      ).toStrictEqual([]);
    });
  });

  describe('setShowTestnetMessageInDropdown', () => {
    it('sets whether the testnet dismissal link should be shown in the network dropdown', () => {
      appStateController.setShowTestnetMessageInDropdown(true);
      expect(
        appStateController.store.getState().showTestnetMessageInDropdown,
      ).toBe(true);

      appStateController.setShowTestnetMessageInDropdown(false);
      expect(
        appStateController.store.getState().showTestnetMessageInDropdown,
      ).toBe(false);
    });
  });

  describe('setShowBetaHeader', () => {
    it('sets whether the beta notification heading on the home page', () => {
      appStateController.setShowBetaHeader(true);
      expect(appStateController.store.getState().showBetaHeader).toBe(true);

      appStateController.setShowBetaHeader(false);
      expect(appStateController.store.getState().showBetaHeader).toBe(false);
    });
  });

  describe('setCurrentPopupId', () => {
    it('sets the currentPopupId in the appState', () => {
      const popupId = 'popup1';

      appStateController.setCurrentPopupId(popupId);
      expect(appStateController.store.getState().currentPopupId).toBe(popupId);
    });
  });

  describe('getCurrentPopupId', () => {
    it('retrieves the currentPopupId saved in the appState', () => {
      const popupId = 'popup1';

      appStateController.setCurrentPopupId(popupId);
      expect(appStateController.getCurrentPopupId()).toBe(popupId);
    });
  });

  describe('setFirstTimeUsedNetwork', () => {
    it('updates the array of the first time used networks', () => {
      const chainId = '0x1';

      appStateController.setFirstTimeUsedNetwork(chainId);
      expect(appStateController.store.getState().usedNetworks[chainId]).toBe(
        true,
      );
    });
  });

  describe('setSnapsInstallPrivacyWarningShownStatus', () => {
    it('updates the status of snaps install privacy warning', () => {
      appStateController = createAppStateController();
      const updateStateSpy = jest.spyOn(
        appStateController.store,
        'updateState',
      );

      appStateController.setSnapsInstallPrivacyWarningShownStatus(true);

      expect(updateStateSpy).toHaveBeenCalledTimes(1);
      expect(updateStateSpy).toHaveBeenCalledWith({
        snapsInstallPrivacyWarningShown: true,
      });

      updateStateSpy.mockRestore();
    });
  });
});
