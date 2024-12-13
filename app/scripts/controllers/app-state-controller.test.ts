import { ControllerMessenger } from '@metamask/base-controller';
import type {
  AcceptRequest,
  AddApprovalRequest,
} from '@metamask/approval-controller';
import { KeyringControllerQRKeyringStateChangeEvent } from '@metamask/keyring-controller';
import { Browser } from 'webextension-polyfill';
import {
  ENVIRONMENT_TYPE_POPUP,
  ORIGIN_METAMASK,
  POLLING_TOKEN_ENVIRONMENT_TYPES,
} from '../../../shared/constants/app';
import { AccountOverviewTabKey } from '../../../shared/constants/app-state';
import { MINUTE } from '../../../shared/constants/time';
import { AppStateController } from './app-state-controller';
import type {
  AppStateControllerActions,
  AppStateControllerEvents,
  AppStateControllerOptions,
} from './app-state-controller';
import type {
  PreferencesControllerState,
  PreferencesControllerGetStateAction,
  PreferencesControllerStateChangeEvent,
} from './preferences-controller';

jest.mock('webextension-polyfill');

const mockIsManifestV3 = jest.fn().mockReturnValue(false);
jest.mock('../../../shared/modules/mv3.utils', () => ({
  get isManifestV3() {
    return mockIsManifestV3();
  },
}));

const extensionMock = {
  alarms: {
    getAll: jest.fn(() => Promise.resolve([])),
    create: jest.fn(),
    clear: jest.fn(),
    onAlarm: {
      addListener: jest.fn(),
    },
  },
} as unknown as jest.Mocked<Browser>;

describe('AppStateController', () => {
  describe('setOutdatedBrowserWarningLastShown', () => {
    it('sets the last shown time', async () => {
      await withController(({ controller }) => {
        const timestamp: number = Date.now();

        controller.setOutdatedBrowserWarningLastShown(timestamp);

        expect(controller.state.outdatedBrowserWarningLastShown).toStrictEqual(
          timestamp,
        );
      });
    });

    it('sets outdated browser warning last shown timestamp', async () => {
      await withController(({ controller }) => {
        const lastShownTimestamp: number = Date.now();

        controller.setOutdatedBrowserWarningLastShown(lastShownTimestamp);

        expect(controller.state.outdatedBrowserWarningLastShown).toStrictEqual(
          lastShownTimestamp,
        );
      });
    });
  });

  describe('getUnlockPromise', () => {
    it('waits for unlock if the extension is locked', async () => {
      await withController(({ controller }) => {
        const isUnlockedMock = jest
          .spyOn(controller, 'isUnlocked')
          .mockReturnValue(false);
        expect(controller.waitingForUnlock).toHaveLength(0);

        controller.getUnlockPromise(true);
        expect(isUnlockedMock).toHaveBeenCalled();
        expect(controller.waitingForUnlock).toHaveLength(1);
      });
    });

    it('resolves immediately if the extension is already unlocked', async () => {
      await withController(async ({ controller }) => {
        const isUnlockedMock = jest
          .spyOn(controller, 'isUnlocked')
          .mockReturnValue(true);

        await expect(
          controller.getUnlockPromise(false),
        ).resolves.toBeUndefined();

        expect(isUnlockedMock).toHaveBeenCalled();
      });
    });

    it('publishes an unlock change event when isUnlocked is set to false', async () => {
      await withController(async ({ controller, controllerMessenger }) => {
        jest.spyOn(controller, 'isUnlocked').mockReturnValue(false);
        const unlockChangeSpy = jest.fn();
        controllerMessenger.subscribe(
          'AppStateController:unlockChange',
          unlockChangeSpy,
        );
        const unlockPromise = controller.getUnlockPromise(false);

        const timeoutPromise = new Promise((resolve) =>
          setTimeout(() => resolve('timeout'), 100),
        );

        const result = await Promise.race([unlockPromise, timeoutPromise]);

        expect(result).toBe('timeout');

        expect(unlockChangeSpy).toHaveBeenCalled();
      });
    });

    it('creates approval request when waitForUnlock is called with shouldShowUnlockRequest as true', async () => {
      const addRequestMock = jest.fn().mockResolvedValue(undefined);
      await withController({ addRequestMock }, async ({ controller }) => {
        jest.spyOn(controller, 'isUnlocked').mockReturnValue(false);

        controller.getUnlockPromise(true);

        expect(addRequestMock).toHaveBeenCalled();
        expect(addRequestMock).toHaveBeenCalledWith(
          {
            id: expect.any(String),
            origin: ORIGIN_METAMASK,
            type: 'unlock',
          },
          true,
        );
      });
    });

    it('accepts approval request revolving all the related promises', async () => {
      let unlockListener: () => void;
      const addRequestMock = jest.fn().mockResolvedValue(undefined);
      await withController(
        {
          addRequestMock,
          options: {
            addUnlockListener: (listener) => {
              unlockListener = listener;
            },
          },
        },
        ({ controller, controllerMessenger }) => {
          jest.spyOn(controller, 'isUnlocked').mockReturnValue(false);
          const unlockChangeSpy = jest.fn();
          controllerMessenger.subscribe(
            'AppStateController:unlockChange',
            unlockChangeSpy,
          );

          controller.getUnlockPromise(true);

          unlockListener();

          expect(unlockChangeSpy).toHaveBeenCalled();
          expect(addRequestMock).toHaveBeenCalled();
          expect(addRequestMock).toHaveBeenCalledWith(
            {
              id: expect.any(String),
              origin: ORIGIN_METAMASK,
              type: 'unlock',
            },
            true,
          );
        },
      );
    });
  });

  describe('setDefaultHomeActiveTabName', () => {
    it('sets the default home tab name', async () => {
      await withController(({ controller }) => {
        controller.setDefaultHomeActiveTabName(AccountOverviewTabKey.Activity);

        expect(controller.state.defaultHomeActiveTabName).toBe(
          AccountOverviewTabKey.Activity,
        );
      });
    });
  });

  describe('setConnectedStatusPopoverHasBeenShown', () => {
    it('sets connected status popover as shown', async () => {
      await withController(({ controller }) => {
        controller.setConnectedStatusPopoverHasBeenShown();

        expect(controller.state.connectedStatusPopoverHasBeenShown).toBe(true);
      });
    });
  });

  describe('setRecoveryPhraseReminderHasBeenShown', () => {
    it('sets recovery phrase reminder as shown', async () => {
      await withController(({ controller }) => {
        controller.setRecoveryPhraseReminderHasBeenShown();

        expect(controller.state.recoveryPhraseReminderHasBeenShown).toBe(true);
      });
    });
  });

  describe('setRecoveryPhraseReminderLastShown', () => {
    it('sets the last shown time of recovery phrase reminder', async () => {
      await withController(({ controller }) => {
        const timestamp = Date.now();
        controller.setRecoveryPhraseReminderLastShown(timestamp);

        expect(controller.state.recoveryPhraseReminderLastShown).toBe(
          timestamp,
        );
      });
    });
  });

  describe('setLastActiveTime', () => {
    it('sets the timer if timeoutMinutes is set', async () => {
      await withController(({ controller, controllerMessenger }) => {
        const timeout = Date.now();
        controllerMessenger.publish(
          'PreferencesController:stateChange',
          {
            preferences: { autoLockTimeLimit: timeout },
          } as unknown as PreferencesControllerState,
          [],
        );
        jest.spyOn(global, 'setTimeout');

        controller.setLastActiveTime();

        expect(setTimeout).toHaveBeenCalledWith(
          expect.any(Function),
          timeout * MINUTE,
        );
      });
    });

    it("doesn't set the timer if timeoutMinutes is not set", async () => {
      await withController(({ controller }) => {
        jest.spyOn(global, 'setTimeout');

        controller.setLastActiveTime();

        expect(setTimeout).toHaveBeenCalledTimes(0);
      });
    });
  });

  describe('setBrowserEnvironment', () => {
    it('sets the current browser and OS environment', async () => {
      await withController(({ controller }) => {
        controller.setBrowserEnvironment('Windows', 'Chrome');

        expect(controller.state.browserEnvironment).toStrictEqual({
          os: 'Windows',
          browser: 'Chrome',
        });
      });
    });
  });

  describe('addPollingToken', () => {
    it('adds a pollingToken for a given environmentType', async () => {
      await withController(({ controller }) => {
        const pollingTokenType =
          POLLING_TOKEN_ENVIRONMENT_TYPES[ENVIRONMENT_TYPE_POPUP];
        controller.addPollingToken('token1', pollingTokenType);

        expect(controller.state[pollingTokenType]).toContain('token1');
      });
    });
  });

  describe('removePollingToken', () => {
    it('removes a pollingToken for a given environmentType', async () => {
      await withController(({ controller }) => {
        const pollingTokenType =
          POLLING_TOKEN_ENVIRONMENT_TYPES[ENVIRONMENT_TYPE_POPUP];

        controller.addPollingToken('token1', pollingTokenType);
        controller.removePollingToken('token1', pollingTokenType);

        expect(controller.state[pollingTokenType]).not.toContain('token1');
      });
    });
  });

  describe('clearPollingTokens', () => {
    it('clears all pollingTokens', async () => {
      await withController(({ controller }) => {
        controller.addPollingToken('token1', 'popupGasPollTokens');
        controller.addPollingToken('token2', 'notificationGasPollTokens');
        controller.addPollingToken('token3', 'fullScreenGasPollTokens');
        controller.clearPollingTokens();

        expect(controller.state.popupGasPollTokens).toStrictEqual([]);
        expect(controller.state.notificationGasPollTokens).toStrictEqual([]);
        expect(controller.state.fullScreenGasPollTokens).toStrictEqual([]);
      });
    });
  });

  describe('setShowTestnetMessageInDropdown', () => {
    it('sets whether the testnet dismissal link should be shown in the network dropdown', async () => {
      await withController(({ controller }) => {
        controller.setShowTestnetMessageInDropdown(true);

        expect(controller.state.showTestnetMessageInDropdown).toBe(true);

        controller.setShowTestnetMessageInDropdown(false);

        expect(controller.state.showTestnetMessageInDropdown).toBe(false);
      });
    });
  });

  describe('setShowBetaHeader', () => {
    it('sets whether the beta notification heading on the home page', async () => {
      await withController(({ controller }) => {
        controller.setShowBetaHeader(true);

        expect(controller.state.showBetaHeader).toBe(true);

        controller.setShowBetaHeader(false);

        expect(controller.state.showBetaHeader).toBe(false);
      });
    });
  });

  describe('setCurrentPopupId', () => {
    it('sets the currentPopupId in the appState', async () => {
      await withController(({ controller }) => {
        const popupId = 12345;

        controller.setCurrentPopupId(popupId);

        expect(controller.state.currentPopupId).toBe(popupId);
      });
    });
  });

  describe('getCurrentPopupId', () => {
    it('retrieves the currentPopupId saved in the appState', async () => {
      await withController(({ controller }) => {
        const popupId = 54321;

        controller.setCurrentPopupId(popupId);

        expect(controller.getCurrentPopupId()).toBe(popupId);
      });
    });
  });

  describe('setLastInteractedConfirmationInfo', () => {
    it('sets information about last confirmation user has interacted with', async () => {
      await withController(({ controller }) => {
        const lastInteractedConfirmationInfo = {
          id: '123',
          chainId: '0x1',
          timestamp: new Date().getTime(),
        };

        controller.setLastInteractedConfirmationInfo(
          lastInteractedConfirmationInfo,
        );

        expect(controller.getLastInteractedConfirmationInfo()).toBe(
          lastInteractedConfirmationInfo,
        );

        controller.setLastInteractedConfirmationInfo(undefined);

        expect(controller.getLastInteractedConfirmationInfo()).toBe(undefined);
      });
    });
  });

  describe('setSnapsInstallPrivacyWarningShownStatus', () => {
    it('updates the status of snaps install privacy warning', async () => {
      await withController(({ controller }) => {
        controller.setSnapsInstallPrivacyWarningShownStatus(true);

        expect(controller.state.snapsInstallPrivacyWarningShown).toStrictEqual(
          true,
        );
      });
    });
  });

  describe('institutional', () => {
    it('set the interactive replacement token with a url and the old refresh token', async () => {
      await withController(({ controller }) => {
        const mockParams = {
          url: 'https://example.com',
          oldRefreshToken: 'old',
        };

        controller.showInteractiveReplacementTokenBanner(mockParams);

        expect(controller.state.interactiveReplacementToken).toStrictEqual(
          mockParams,
        );
      });
    });

    it('set the setCustodianDeepLink with the fromAddress and custodyId', async () => {
      await withController(({ controller }) => {
        const mockParams = {
          fromAddress: '0x',
          custodyId: 'custodyId',
        };

        controller.setCustodianDeepLink(mockParams);

        expect(controller.state.custodianDeepLink).toStrictEqual(mockParams);
      });
    });

    it('set the setNoteToTraderMessage with a message', async () => {
      await withController(({ controller }) => {
        const mockParams = 'some message';

        controller.setNoteToTraderMessage(mockParams);

        expect(controller.state.noteToTraderMessage).toStrictEqual(mockParams);
      });
    });
  });

  describe('setSurveyLinkLastClickedOrClosed', () => {
    it('set the surveyLinkLastClickedOrClosed time', async () => {
      await withController(({ controller }) => {
        const mockParams = Date.now();

        controller.setSurveyLinkLastClickedOrClosed(mockParams);

        expect(controller.state.surveyLinkLastClickedOrClosed).toStrictEqual(
          mockParams,
        );
      });
    });
  });

  describe('setOnboardingDate', () => {
    it('set the onboardingDate', async () => {
      await withController(({ controller }) => {
        const mockDateNow = 1620000000000;
        jest.spyOn(Date, 'now').mockReturnValue(mockDateNow);

        controller.setOnboardingDate();

        expect(controller.state.onboardingDate).toStrictEqual(mockDateNow);
      });
    });
  });

  describe('setLastViewedUserSurvey', () => {
    it('set the lastViewedUserSurvey with id 1', async () => {
      await withController(({ controller }) => {
        const mockParams = 1;

        controller.setLastViewedUserSurvey(mockParams);

        expect(controller.state.lastViewedUserSurvey).toStrictEqual(mockParams);
      });
    });
  });

  describe('setNewPrivacyPolicyToastClickedOrClosed', () => {
    it('set the newPrivacyPolicyToastClickedOrClosed to true', async () => {
      await withController(({ controller }) => {
        controller.setNewPrivacyPolicyToastClickedOrClosed();

        expect(
          controller.state.newPrivacyPolicyToastClickedOrClosed,
        ).toStrictEqual(true);
      });
    });
  });

  describe('setNewPrivacyPolicyToastShownDate', () => {
    it('set the newPrivacyPolicyToastShownDate', async () => {
      await withController(({ controller }) => {
        const mockParams = Date.now();

        controller.setNewPrivacyPolicyToastShownDate(mockParams);

        expect(controller.state.newPrivacyPolicyToastShownDate).toStrictEqual(
          mockParams,
        );
      });
    });
  });

  describe('setTermsOfUseLastAgreed', () => {
    it('set the termsOfUseLastAgreed timestamp', async () => {
      await withController(({ controller }) => {
        const mockParams = Date.now();

        controller.setTermsOfUseLastAgreed(mockParams);

        expect(controller.state.termsOfUseLastAgreed).toStrictEqual(mockParams);
      });
    });
  });

  describe('onPreferencesStateChange', () => {
    it('should update the timeoutMinutes with the autoLockTimeLimit', async () => {
      await withController(({ controller, controllerMessenger }) => {
        const timeout = Date.now();

        controllerMessenger.publish(
          'PreferencesController:stateChange',
          {
            preferences: { autoLockTimeLimit: timeout },
          } as unknown as PreferencesControllerState,
          [],
        );

        expect(controller.state.timeoutMinutes).toStrictEqual(timeout);
      });
    });
  });

  describe('isManifestV3', () => {
    it('creates alarm when isManifestV3 is true', async () => {
      mockIsManifestV3.mockReturnValue(true);
      await withController(({ controller, controllerMessenger }) => {
        const timeout = Date.now();
        controllerMessenger.publish(
          'PreferencesController:stateChange',
          {
            preferences: { autoLockTimeLimit: timeout },
          } as unknown as PreferencesControllerState,
          [],
        );
        controller.setLastActiveTime();

        expect(extensionMock.alarms.clear).toHaveBeenCalled();
        expect(extensionMock.alarms.onAlarm.addListener).toHaveBeenCalled();
      });
    });
  });
});

type WithControllerOptions = {
  options?: Partial<AppStateControllerOptions>;
  addRequestMock?: jest.Mock;
};

type WithControllerCallback<ReturnValue> = ({
  controller,
  controllerMessenger,
}: {
  controller: AppStateController;
  controllerMessenger: ControllerMessenger<
    | AppStateControllerActions
    | AddApprovalRequest
    | AcceptRequest
    | PreferencesControllerGetStateAction,
    | AppStateControllerEvents
    | PreferencesControllerStateChangeEvent
    | KeyringControllerQRKeyringStateChangeEvent
  >;
}) => ReturnValue;

type WithControllerArgs<ReturnValue> =
  | [WithControllerCallback<ReturnValue>]
  | [WithControllerOptions, WithControllerCallback<ReturnValue>];

async function withController<ReturnValue>(
  ...args: WithControllerArgs<ReturnValue>
): Promise<ReturnValue> {
  const [{ ...rest }, fn] = args.length === 2 ? args : [{}, args[0]];
  const { addRequestMock, options = {} } = rest;

  const controllerMessenger = new ControllerMessenger<
    | AppStateControllerActions
    | AddApprovalRequest
    | AcceptRequest
    | PreferencesControllerGetStateAction,
    | AppStateControllerEvents
    | PreferencesControllerStateChangeEvent
    | KeyringControllerQRKeyringStateChangeEvent
  >();
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
  controllerMessenger.registerActionHandler(
    'ApprovalController:addRequest',
    addRequestMock || jest.fn().mockResolvedValue(undefined),
  );

  return fn({
    controller: new AppStateController({
      addUnlockListener: jest.fn(),
      isUnlocked: jest.fn(() => true),
      onInactiveTimeout: jest.fn(),
      messenger: appStateMessenger,
      extension: extensionMock,
      ...options,
    }),
    controllerMessenger,
  });
}
