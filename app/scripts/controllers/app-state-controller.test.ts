import {
  AcceptRequest,
  AddApprovalRequest,
} from '@metamask/approval-controller';
import { ControllerMessenger } from '@metamask/base-controller';
import { KeyringControllerQRKeyringStateChangeEvent } from '@metamask/keyring-controller';
import { Browser } from 'webextension-polyfill';
import {
  ENVIRONMENT_TYPE_POPUP,
  ORIGIN_METAMASK,
  POLLING_TOKEN_ENVIRONMENT_TYPES,
} from '../../../shared/constants/app';
import { AppStateController } from './app-state-controller';
import type {
  AllowedActions,
  AllowedEvents,
  AppStateControllerActions,
  AppStateControllerEvents,
  AppStateControllerState,
} from './app-state-controller';
import { PreferencesControllerStateChangeEvent } from './preferences-controller';

jest.mock('webextension-polyfill');

let appStateController: AppStateController;
let controllerMessenger: ControllerMessenger<
  | AppStateControllerActions
  | AllowedActions
  | AddApprovalRequest
  | AcceptRequest,
  | AppStateControllerEvents
  | AllowedEvents
  | PreferencesControllerStateChangeEvent
  | KeyringControllerQRKeyringStateChangeEvent
>;

describe('AppStateController', () => {
  const createAppStateController = (
    initState: Partial<AppStateControllerState> = {},
  ): AppStateController => {
    controllerMessenger = new ControllerMessenger();
    jest.spyOn(ControllerMessenger.prototype, 'call');
    const appStateMessenger = controllerMessenger.getRestricted({
      name: 'AppStateController',
      allowedActions: [
        `ApprovalController:addRequest`,
        `ApprovalController:acceptRequest`,
        `PreferencesController:getState`,
      ],
      allowedEvents: [
        `PreferencesController:stateChange`,
        `KeyringController:qrKeyringStateChange`,
      ],
    });
    controllerMessenger.registerActionHandler(
      'PreferencesController:getState',
      jest.fn().mockReturnValue({
        preferences: {
          autoLockTimeLimit: 0,
        },
      }),
    );
    return new AppStateController({
      addUnlockListener: jest.fn(),
      isUnlocked: jest.fn(() => true),
      initState,
      onInactiveTimeout: jest.fn(),
      messenger: appStateMessenger,
      extension: {
        alarms: {
          getAll: jest.fn(() => Promise.resolve([])),
          create: jest.fn(),
          clear: jest.fn(),
          onAlarm: {
            addListener: jest.fn(),
          },
        },
      } as unknown as jest.Mocked<Browser>,
    });
  };

  const createIsUnlockedMock = (isUnlocked: boolean) => {
    return jest
      .spyOn(
        appStateController as unknown as { isUnlocked: () => boolean },
        'isUnlocked',
      )
      .mockReturnValue(isUnlocked);
  };

  beforeEach(() => {
    appStateController = createAppStateController();
  });

  describe('setOutdatedBrowserWarningLastShown', () => {
    it('sets the last shown time', () => {
      appStateController = createAppStateController();
      const timestamp: number = Date.now();

      appStateController.setOutdatedBrowserWarningLastShown(timestamp);

      expect(
        appStateController.store.getState().outdatedBrowserWarningLastShown,
      ).toStrictEqual(timestamp);
    });

    it('sets outdated browser warning last shown timestamp', () => {
      const lastShownTimestamp: number = Date.now();
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
      appStateController = createAppStateController({});
      const isUnlockedMock = createIsUnlockedMock(false);
      const waitForUnlockSpy = jest.spyOn(appStateController, 'waitForUnlock');

      appStateController.getUnlockPromise(true);
      expect(isUnlockedMock).toHaveBeenCalled();
      expect(waitForUnlockSpy).toHaveBeenCalledWith(expect.any(Function), true);
    });

    it('resolves immediately if the extension is already unlocked', async () => {
      appStateController = createAppStateController();
      const isUnlockedMock = createIsUnlockedMock(true);

      await expect(
        appStateController.getUnlockPromise(false),
      ).resolves.toBeUndefined();

      expect(isUnlockedMock).toHaveBeenCalled();
    });
  });

  describe('waitForUnlock', () => {
    it('resolves immediately if already unlocked', async () => {
      const emitSpy = jest.spyOn(appStateController, 'emit');
      const resolveFn: () => void = jest.fn();
      appStateController.waitForUnlock(resolveFn, false);
      expect(emitSpy).toHaveBeenCalledWith('updateBadge');
      expect(controllerMessenger.call).toHaveBeenCalledTimes(1);
    });

    it('creates approval request when waitForUnlock is called with shouldShowUnlockRequest as true', async () => {
      const addRequestSpy = jest.fn().mockImplementation(() => ({
        catch: jest.fn(),
      }));
      controllerMessenger.registerActionHandler(
        'ApprovalController:addRequest',
        addRequestSpy,
      );
      createIsUnlockedMock(false);

      const resolveFn: () => void = jest.fn();
      appStateController.waitForUnlock(resolveFn, true);

      expect(controllerMessenger.call).toHaveBeenCalledTimes(2);
      expect(controllerMessenger.call).toHaveBeenCalledWith(
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
      createIsUnlockedMock(false);
    });
    afterEach(() => {
      jest.clearAllMocks();
    });
    it('accepts approval request revolving all the related promises', async () => {
      const addRequestSpy = jest.fn().mockImplementation(() => ({
        catch: jest.fn(),
      }));
      controllerMessenger.registerActionHandler(
        'ApprovalController:addRequest',
        addRequestSpy,
      );
      const emitSpy = jest.spyOn(appStateController, 'emit');
      const resolveFn: () => void = jest.fn();
      appStateController.waitForUnlock(resolveFn, true);

      appStateController.handleUnlock();

      expect(emitSpy).toHaveBeenCalled();
      expect(emitSpy).toHaveBeenCalledWith('updateBadge');
      expect(controllerMessenger.call).toHaveBeenCalled();
      expect(controllerMessenger.call).toHaveBeenCalledWith(
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
      const timestamp: number = Date.now();
      appStateController.setRecoveryPhraseReminderLastShown(timestamp);

      expect(
        appStateController.store.getState().recoveryPhraseReminderLastShown,
      ).toBe(timestamp);
    });
  });

  describe('setLastActiveTime', () => {
    it('sets the last active time to the current time', () => {
      const spy = jest.spyOn(
        appStateController as unknown as { _resetTimer: () => void },
        '_resetTimer',
      );
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
      const pollingTokenType =
        POLLING_TOKEN_ENVIRONMENT_TYPES[ENVIRONMENT_TYPE_POPUP];
      appStateController.addPollingToken('token1', pollingTokenType);
      expect(appStateController.store.getState()[pollingTokenType]).toContain(
        'token1',
      );
    });
  });

  describe('removePollingToken', () => {
    it('removes a pollingToken for a given environmentType', () => {
      const pollingTokenType =
        POLLING_TOKEN_ENVIRONMENT_TYPES[ENVIRONMENT_TYPE_POPUP];
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
      const popupId = 12345;

      appStateController.setCurrentPopupId(popupId);
      expect(appStateController.store.getState().currentPopupId).toBe(popupId);
    });
  });

  describe('getCurrentPopupId', () => {
    it('retrieves the currentPopupId saved in the appState', () => {
      const popupId = 54321;

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

  describe('setLastInteractedConfirmationInfo', () => {
    it('sets information about last confirmation user has interacted with', () => {
      const lastInteractedConfirmationInfo = {
        id: '123',
        chainId: '0x1',
        timestamp: new Date().getTime(),
      };
      appStateController.setLastInteractedConfirmationInfo(
        lastInteractedConfirmationInfo,
      );
      expect(appStateController.getLastInteractedConfirmationInfo()).toBe(
        lastInteractedConfirmationInfo,
      );

      appStateController.setLastInteractedConfirmationInfo(undefined);
      expect(appStateController.getLastInteractedConfirmationInfo()).toBe(
        undefined,
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

  describe('institutional', () => {
    it('set the interactive replacement token with a url and the old refresh token', () => {
      appStateController = createAppStateController();
      const updateStateSpy = jest.spyOn(
        appStateController.store,
        'updateState',
      );

      const mockParams = {
        url: 'https://example.com',
        oldRefreshToken: 'old',
      };

      appStateController.showInteractiveReplacementTokenBanner(mockParams);

      expect(updateStateSpy).toHaveBeenCalledTimes(1);
      expect(updateStateSpy).toHaveBeenCalledWith({
        interactiveReplacementToken: mockParams,
      });

      updateStateSpy.mockRestore();
    });

    it('set the setCustodianDeepLink with the fromAddress and custodyId', () => {
      appStateController = createAppStateController();
      const updateStateSpy = jest.spyOn(
        appStateController.store,
        'updateState',
      );

      const mockParams = {
        fromAddress: '0x',
        custodyId: 'custodyId',
      };

      appStateController.setCustodianDeepLink(mockParams);

      expect(updateStateSpy).toHaveBeenCalledTimes(1);
      expect(updateStateSpy).toHaveBeenCalledWith({
        custodianDeepLink: mockParams,
      });

      updateStateSpy.mockRestore();
    });

    it('set the setNoteToTraderMessage with a message', () => {
      appStateController = createAppStateController();
      const updateStateSpy = jest.spyOn(
        appStateController.store,
        'updateState',
      );

      const mockParams = 'some message';

      appStateController.setNoteToTraderMessage(mockParams);

      expect(updateStateSpy).toHaveBeenCalledTimes(1);
      expect(updateStateSpy).toHaveBeenCalledWith({
        noteToTraderMessage: mockParams,
      });

      updateStateSpy.mockRestore();
    });
  });
});
