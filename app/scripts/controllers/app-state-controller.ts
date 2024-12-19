import { v4 as uuid } from 'uuid';
import log from 'loglevel';
import { ApprovalType } from '@metamask/controller-utils';
import { KeyringControllerQRKeyringStateChangeEvent } from '@metamask/keyring-controller';
import {
  BaseController,
  ControllerGetStateAction,
  ControllerStateChangeEvent,
  RestrictedControllerMessenger,
} from '@metamask/base-controller';
import {
  AcceptRequest,
  AddApprovalRequest,
} from '@metamask/approval-controller';
import { Json } from '@metamask/utils';
import { Browser } from 'webextension-polyfill';
import { MINUTE } from '../../../shared/constants/time';
import { AUTO_LOCK_TIMEOUT_ALARM } from '../../../shared/constants/alarms';
import { isManifestV3 } from '../../../shared/modules/mv3.utils';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { isBeta } from '../../../ui/helpers/utils/build-types';
import {
  ENVIRONMENT_TYPE_BACKGROUND,
  POLLING_TOKEN_ENVIRONMENT_TYPES,
  ORIGIN_METAMASK,
} from '../../../shared/constants/app';
import { DEFAULT_AUTO_LOCK_TIME_LIMIT } from '../../../shared/constants/preferences';
import { LastInteractedConfirmationInfo } from '../../../shared/types/confirm';
import { SecurityAlertResponse } from '../lib/ppom/types';
import {
  AccountOverviewTabKey,
  CarouselSlide,
} from '../../../shared/constants/app-state';
import type {
  Preferences,
  PreferencesControllerGetStateAction,
  PreferencesControllerStateChangeEvent,
} from './preferences-controller';

export type AppStateControllerState = {
  timeoutMinutes: number;
  connectedStatusPopoverHasBeenShown: boolean;
  defaultHomeActiveTabName: AccountOverviewTabKey | null;
  browserEnvironment: Record<string, string>;
  popupGasPollTokens: string[];
  notificationGasPollTokens: string[];
  fullScreenGasPollTokens: string[];
  recoveryPhraseReminderHasBeenShown: boolean;
  recoveryPhraseReminderLastShown: number;
  outdatedBrowserWarningLastShown: number | null;
  nftsDetectionNoticeDismissed: boolean;
  showTestnetMessageInDropdown: boolean;
  showBetaHeader: boolean;
  showPermissionsTour: boolean;
  showNetworkBanner: boolean;
  showAccountBanner: boolean;
  trezorModel: string | null;
  currentPopupId?: number;
  onboardingDate: number | null;
  lastViewedUserSurvey: number | null;
  newPrivacyPolicyToastClickedOrClosed: boolean | null;
  newPrivacyPolicyToastShownDate: number | null;
  // This key is only used for checking if the user had set advancedGasFee
  // prior to Migration 92.3 where we split out the setting to support
  // multiple networks.
  hadAdvancedGasFeesSetPriorToMigration92_3: boolean;
  qrHardware: Json;
  nftsDropdownState: Json;
  surveyLinkLastClickedOrClosed: number | null;
  signatureSecurityAlertResponses: Record<string, SecurityAlertResponse>;
  // States used for displaying the changed network toast
  switchedNetworkDetails: Record<string, string> | null;
  switchedNetworkNeverShowMessage: boolean;
  currentExtensionPopupId: number;
  lastInteractedConfirmationInfo?: LastInteractedConfirmationInfo;
  termsOfUseLastAgreed?: number;
  snapsInstallPrivacyWarningShown?: boolean;
  interactiveReplacementToken?: { url: string; oldRefreshToken: string };
  noteToTraderMessage?: string;
  custodianDeepLink?: { fromAddress: string; custodyId: string };
  slides: CarouselSlide[];
};

const controllerName = 'AppStateController';

/**
 * Returns the state of the {@link AppStateController}.
 */
export type AppStateControllerGetStateAction = ControllerGetStateAction<
  typeof controllerName,
  AppStateControllerState
>;

/**
 * Actions exposed by the {@link AppStateController}.
 */
export type AppStateControllerActions = AppStateControllerGetStateAction;

/**
 * Actions that this controller is allowed to call.
 */
type AllowedActions =
  | AddApprovalRequest
  | AcceptRequest
  | PreferencesControllerGetStateAction;

/**
 * Event emitted when the state of the {@link AppStateController} changes.
 */
export type AppStateControllerStateChangeEvent = ControllerStateChangeEvent<
  typeof controllerName,
  AppStateControllerState
>;

export type AppStateControllerUnlockChangeEvent = {
  type: 'AppStateController:unlockChange';
  payload: [];
};

/**
 * Events emitted by {@link AppStateController}.
 */
export type AppStateControllerEvents =
  | AppStateControllerStateChangeEvent
  | AppStateControllerUnlockChangeEvent;

/**
 * Events that this controller is allowed to subscribe.
 */
type AllowedEvents =
  | PreferencesControllerStateChangeEvent
  | KeyringControllerQRKeyringStateChangeEvent;

export type AppStateControllerMessenger = RestrictedControllerMessenger<
  typeof controllerName,
  AppStateControllerActions | AllowedActions,
  AppStateControllerEvents | AllowedEvents,
  AllowedActions['type'],
  AllowedEvents['type']
>;

type PollingTokenType =
  | 'popupGasPollTokens'
  | 'notificationGasPollTokens'
  | 'fullScreenGasPollTokens';

type AppStateControllerInitState = Partial<
  Omit<
    AppStateControllerState,
    | 'qrHardware'
    | 'nftsDropdownState'
    | 'signatureSecurityAlertResponses'
    | 'switchedNetworkDetails'
    | 'currentExtensionPopupId'
  >
>;

export type AppStateControllerOptions = {
  addUnlockListener: (callback: () => void) => void;
  isUnlocked: () => boolean;
  state?: AppStateControllerInitState;
  onInactiveTimeout?: () => void;
  messenger: AppStateControllerMessenger;
  extension: Browser;
};

const getDefaultAppStateControllerState = (): AppStateControllerState => ({
  timeoutMinutes: DEFAULT_AUTO_LOCK_TIME_LIMIT,
  connectedStatusPopoverHasBeenShown: true,
  defaultHomeActiveTabName: null,
  browserEnvironment: {},
  popupGasPollTokens: [],
  notificationGasPollTokens: [],
  fullScreenGasPollTokens: [],
  recoveryPhraseReminderHasBeenShown: false,
  recoveryPhraseReminderLastShown: new Date().getTime(),
  outdatedBrowserWarningLastShown: null,
  nftsDetectionNoticeDismissed: false,
  showTestnetMessageInDropdown: true,
  showBetaHeader: isBeta(),
  showPermissionsTour: true,
  showNetworkBanner: true,
  showAccountBanner: true,
  trezorModel: null,
  onboardingDate: null,
  lastViewedUserSurvey: null,
  newPrivacyPolicyToastClickedOrClosed: null,
  newPrivacyPolicyToastShownDate: null,
  hadAdvancedGasFeesSetPriorToMigration92_3: false,
  surveyLinkLastClickedOrClosed: null,
  switchedNetworkNeverShowMessage: false,
  slides: [],
  ...getInitialStateOverrides(),
});

function getInitialStateOverrides() {
  return {
    qrHardware: {},
    nftsDropdownState: {},
    signatureSecurityAlertResponses: {},
    switchedNetworkDetails: null,
    currentExtensionPopupId: 0,
  };
}

const controllerMetadata = {
  timeoutMinutes: {
    persist: true,
    anonymous: true,
  },
  connectedStatusPopoverHasBeenShown: {
    persist: true,
    anonymous: true,
  },
  defaultHomeActiveTabName: {
    persist: true,
    anonymous: true,
  },
  browserEnvironment: {
    persist: true,
    anonymous: true,
  },
  popupGasPollTokens: {
    persist: false,
    anonymous: true,
  },
  notificationGasPollTokens: {
    persist: false,
    anonymous: true,
  },
  fullScreenGasPollTokens: {
    persist: false,
    anonymous: true,
  },
  recoveryPhraseReminderHasBeenShown: {
    persist: true,
    anonymous: true,
  },
  recoveryPhraseReminderLastShown: {
    persist: true,
    anonymous: true,
  },
  outdatedBrowserWarningLastShown: {
    persist: true,
    anonymous: true,
  },
  nftsDetectionNoticeDismissed: {
    persist: true,
    anonymous: true,
  },
  showTestnetMessageInDropdown: {
    persist: true,
    anonymous: true,
  },
  showBetaHeader: {
    persist: true,
    anonymous: true,
  },
  showPermissionsTour: {
    persist: true,
    anonymous: true,
  },
  showNetworkBanner: {
    persist: true,
    anonymous: true,
  },
  showAccountBanner: {
    persist: true,
    anonymous: true,
  },
  trezorModel: {
    persist: true,
    anonymous: true,
  },
  currentPopupId: {
    persist: false,
    anonymous: true,
  },
  onboardingDate: {
    persist: true,
    anonymous: true,
  },
  lastViewedUserSurvey: {
    persist: true,
    anonymous: true,
  },
  newPrivacyPolicyToastClickedOrClosed: {
    persist: true,
    anonymous: true,
  },
  newPrivacyPolicyToastShownDate: {
    persist: true,
    anonymous: true,
  },
  hadAdvancedGasFeesSetPriorToMigration92_3: {
    persist: true,
    anonymous: true,
  },
  qrHardware: {
    persist: false,
    anonymous: true,
  },
  nftsDropdownState: {
    persist: false,
    anonymous: true,
  },
  surveyLinkLastClickedOrClosed: {
    persist: true,
    anonymous: true,
  },
  signatureSecurityAlertResponses: {
    persist: false,
    anonymous: true,
  },
  switchedNetworkDetails: {
    persist: false,
    anonymous: true,
  },
  switchedNetworkNeverShowMessage: {
    persist: true,
    anonymous: true,
  },
  currentExtensionPopupId: {
    persist: false,
    anonymous: true,
  },
  lastInteractedConfirmationInfo: {
    persist: true,
    anonymous: true,
  },
  termsOfUseLastAgreed: {
    persist: true,
    anonymous: true,
  },
  snapsInstallPrivacyWarningShown: {
    persist: true,
    anonymous: true,
  },
  interactiveReplacementToken: {
    persist: true,
    anonymous: true,
  },
  noteToTraderMessage: {
    persist: true,
    anonymous: true,
  },
  custodianDeepLink: {
    persist: true,
    anonymous: true,
  },
  slides: {
    persist: true,
    anonymous: true,
  },
};

export class AppStateController extends BaseController<
  typeof controllerName,
  AppStateControllerState,
  AppStateControllerMessenger
> {
  readonly #extension: AppStateControllerOptions['extension'];

  readonly #onInactiveTimeout: () => void;

  #timer: NodeJS.Timeout | null;

  isUnlocked: () => boolean;

  readonly waitingForUnlock: { resolve: () => void }[];

  #approvalRequestId: string | null;

  constructor({
    state = {},
    messenger,
    addUnlockListener,
    isUnlocked,
    onInactiveTimeout,
    extension,
  }: AppStateControllerOptions) {
    super({
      name: controllerName,
      metadata: controllerMetadata,
      state: {
        ...getDefaultAppStateControllerState(),
        ...state,
        ...getInitialStateOverrides(),
      },
      messenger,
    });

    this.#extension = extension;
    this.#onInactiveTimeout = onInactiveTimeout || (() => undefined);
    this.#timer = null;

    this.isUnlocked = isUnlocked;
    this.waitingForUnlock = [];
    addUnlockListener(this.#handleUnlock.bind(this));

    messenger.subscribe(
      'PreferencesController:stateChange',
      ({ preferences }: { preferences: Partial<Preferences> }) => {
        const currentState = this.state;
        if (
          typeof preferences?.autoLockTimeLimit === 'number' &&
          currentState.timeoutMinutes !== preferences.autoLockTimeLimit
        ) {
          this.#setInactiveTimeout(preferences.autoLockTimeLimit);
        }
      },
    );

    messenger.subscribe(
      'KeyringController:qrKeyringStateChange',
      (qrHardware: Json) =>
        this.update((currentState) => {
          // @ts-expect-error this is caused by a bug in Immer, not being able to handle recursive types like Json
          currentState.qrHardware = qrHardware;
        }),
    );

    const { preferences } = messenger.call('PreferencesController:getState');
    if (typeof preferences.autoLockTimeLimit === 'number') {
      this.#setInactiveTimeout(preferences.autoLockTimeLimit);
    }

    this.#approvalRequestId = null;
  }

  /**
   * Get a Promise that resolves when the extension is unlocked.
   * This Promise will never reject.
   *
   * @param shouldShowUnlockRequest - Whether the extension notification
   * popup should be opened.
   * @returns A promise that resolves when the extension is
   * unlocked, or immediately if the extension is already unlocked.
   */
  getUnlockPromise(shouldShowUnlockRequest: boolean): Promise<void> {
    return new Promise((resolve) => {
      if (this.isUnlocked()) {
        resolve();
      } else {
        this.#waitForUnlock(resolve, shouldShowUnlockRequest);
      }
    });
  }

  /**
   * Adds a Promise's resolve function to the waitingForUnlock queue.
   * Also opens the extension popup if specified.
   *
   * @param resolve - A Promise's resolve function that will
   * be called when the extension is unlocked.
   * @param shouldShowUnlockRequest - Whether the extension notification
   * popup should be opened.
   */
  #waitForUnlock(resolve: () => void, shouldShowUnlockRequest: boolean): void {
    this.waitingForUnlock.push({ resolve });
    this.messagingSystem.publish('AppStateController:unlockChange');
    if (shouldShowUnlockRequest) {
      this.#requestApproval();
    }
  }

  /**
   * Drains the waitingForUnlock queue, resolving all the related Promises.
   */
  #handleUnlock(): void {
    if (this.waitingForUnlock.length > 0) {
      while (this.waitingForUnlock.length > 0) {
        this.waitingForUnlock.shift()?.resolve();
      }
      this.messagingSystem.publish('AppStateController:unlockChange');
    }

    this.#acceptApproval();
  }

  /**
   * Sets the default home tab
   *
   * @param defaultHomeActiveTabName - the tab name
   */
  setDefaultHomeActiveTabName(
    defaultHomeActiveTabName: AccountOverviewTabKey | null,
  ): void {
    this.update((state) => {
      state.defaultHomeActiveTabName = defaultHomeActiveTabName;
    });
  }

  /**
   * Record that the user has seen the connected status info popover
   */
  setConnectedStatusPopoverHasBeenShown(): void {
    this.update((state) => {
      state.connectedStatusPopoverHasBeenShown = true;
    });
  }

  /**
   * Record that the user has been shown the recovery phrase reminder.
   */
  setRecoveryPhraseReminderHasBeenShown(): void {
    this.update((state) => {
      state.recoveryPhraseReminderHasBeenShown = true;
    });
  }

  setSurveyLinkLastClickedOrClosed(time: number): void {
    this.update((state) => {
      state.surveyLinkLastClickedOrClosed = time;
    });
  }

  setOnboardingDate(): void {
    this.update((state) => {
      state.onboardingDate = Date.now();
    });
  }

  setLastViewedUserSurvey(id: number) {
    this.update((state) => {
      state.lastViewedUserSurvey = id;
    });
  }

  setNewPrivacyPolicyToastClickedOrClosed(): void {
    this.update((state) => {
      state.newPrivacyPolicyToastClickedOrClosed = true;
    });
  }

  setNewPrivacyPolicyToastShownDate(time: number): void {
    this.update((state) => {
      state.newPrivacyPolicyToastShownDate = time;
    });
  }

  /**
   * Updates slides by adding new slides that don't already exist in state
   *
   * @param slides - Array of new slides to add
   */
  updateSlides(slides: CarouselSlide[]): void {
    this.update((state) => {
      const currentSlides = state.slides || [];

      // Updates the undismissable property for slides that already exist in state
      const updatedCurrentSlides = currentSlides.map((currentSlide) => {
        const matchingNewSlide = slides.find((s) => s.id === currentSlide.id);
        if (matchingNewSlide) {
          return {
            ...currentSlide,
            undismissable: matchingNewSlide.undismissable,
          };
        }
        return currentSlide;
      });

      // Adds new slides that don't already exist in state
      const newSlides = slides.filter((newSlide) => {
        return !currentSlides.some(
          (currentSlide) => currentSlide.id === newSlide.id,
        );
      });

      state.slides = [...updatedCurrentSlides, ...newSlides];
    });
  }

  /**
   * Marks a slide as dismissed by ID
   *
   * @param id - ID of the slide to dismiss
   */
  removeSlide(id: string): void {
    this.update((state) => {
      const slides = state.slides || [];
      state.slides = slides.map((slide) => {
        if (slide.id === id) {
          return { ...slide, dismissed: true };
        }
        return slide;
      });
    });
  }

  /**
   * Record the timestamp of the last time the user has seen the recovery phrase reminder
   *
   * @param lastShown - timestamp when user was last shown the reminder.
   */
  setRecoveryPhraseReminderLastShown(lastShown: number): void {
    this.update((state) => {
      state.recoveryPhraseReminderLastShown = lastShown;
    });
  }

  /**
   * Record the timestamp of the last time the user has acceoted the terms of use
   *
   * @param lastAgreed - timestamp when user last accepted the terms of use
   */
  setTermsOfUseLastAgreed(lastAgreed: number): void {
    this.update((state) => {
      state.termsOfUseLastAgreed = lastAgreed;
    });
  }

  /**
   * Record if popover for snaps privacy warning has been shown
   * on the first install of a snap.
   *
   * @param shown - shown status
   */
  setSnapsInstallPrivacyWarningShownStatus(shown: boolean): void {
    this.update((state) => {
      state.snapsInstallPrivacyWarningShown = shown;
    });
  }

  /**
   * Record the timestamp of the last time the user has seen the outdated browser warning
   *
   * @param lastShown - Timestamp (in milliseconds) of when the user was last shown the warning.
   */
  setOutdatedBrowserWarningLastShown(lastShown: number): void {
    this.update((state) => {
      state.outdatedBrowserWarningLastShown = lastShown;
    });
  }

  /**
   * Sets the last active time to the current time.
   */
  setLastActiveTime(): void {
    this.#resetTimer();
  }

  /**
   * Sets the inactive timeout for the app
   *
   * @param timeoutMinutes - The inactive timeout in minutes.
   */
  #setInactiveTimeout(timeoutMinutes: number): void {
    this.update((state) => {
      state.timeoutMinutes = timeoutMinutes;
    });

    this.#resetTimer();
  }

  /**
   * Resets the internal inactive timer
   *
   * If the {@code timeoutMinutes} state is falsy (i.e., zero) then a new
   * timer will not be created.
   *
   */
  #resetTimer(): void {
    const { timeoutMinutes } = this.state;

    if (this.#timer) {
      clearTimeout(this.#timer);
    } else if (isManifestV3) {
      this.#extension.alarms.clear(AUTO_LOCK_TIMEOUT_ALARM);
    }

    if (!timeoutMinutes) {
      return;
    }

    // This is a temporary fix until we add a state migration.
    // Due to a bug in ui/pages/settings/advanced-tab/advanced-tab.component.js,
    // it was possible for timeoutMinutes to be saved as a string, as explained
    // in PR 25109. `alarms.create` will fail in that case. We are
    // converting this to a number here to prevent that failure. Once
    // we add a migration to update the malformed state to the right type,
    // we will remove this conversion.
    const timeoutToSet = Number(timeoutMinutes);

    if (isManifestV3) {
      this.#extension.alarms.create(AUTO_LOCK_TIMEOUT_ALARM, {
        delayInMinutes: timeoutToSet,
        periodInMinutes: timeoutToSet,
      });
      this.#extension.alarms.onAlarm.addListener(
        (alarmInfo: { name: string }) => {
          if (alarmInfo.name === AUTO_LOCK_TIMEOUT_ALARM) {
            this.#onInactiveTimeout();
            this.#extension.alarms.clear(AUTO_LOCK_TIMEOUT_ALARM);
          }
        },
      );
    } else {
      this.#timer = setTimeout(
        () => this.#onInactiveTimeout(),
        timeoutToSet * MINUTE,
      );
    }
  }

  /**
   * Sets the current browser and OS environment
   *
   * @param os
   * @param browser
   */
  setBrowserEnvironment(os: string, browser: string): void {
    this.update((state) => {
      state.browserEnvironment = { os, browser };
    });
  }

  /**
   * Adds a pollingToken for a given environmentType
   *
   * @param pollingToken
   * @param pollingTokenType
   */
  addPollingToken(
    pollingToken: string,
    pollingTokenType: PollingTokenType,
  ): void {
    if (
      pollingTokenType.toString() !==
      POLLING_TOKEN_ENVIRONMENT_TYPES[ENVIRONMENT_TYPE_BACKGROUND]
    ) {
      if (this.#isValidPollingTokenType(pollingTokenType)) {
        this.#updatePollingTokens(pollingToken, pollingTokenType);
      }
    }
  }

  /**
   * Updates the polling token in the state.
   *
   * @param pollingToken
   * @param pollingTokenType
   */
  #updatePollingTokens(
    pollingToken: string,
    pollingTokenType: PollingTokenType,
  ) {
    this.update((state) => {
      state[pollingTokenType].push(pollingToken);
    });
  }

  /**
   * removes a pollingToken for a given environmentType
   *
   * @param pollingToken
   * @param pollingTokenType
   */
  removePollingToken(
    pollingToken: string,
    pollingTokenType: PollingTokenType,
  ): void {
    if (
      pollingTokenType.toString() !==
      POLLING_TOKEN_ENVIRONMENT_TYPES[ENVIRONMENT_TYPE_BACKGROUND]
    ) {
      const currentTokens: string[] = this.state[pollingTokenType];
      if (this.#isValidPollingTokenType(pollingTokenType)) {
        this.update((state) => {
          state[pollingTokenType] = currentTokens.filter(
            (token: string) => token !== pollingToken,
          );
        });
      }
    }
  }

  /**
   * Validates whether the given polling token type is a valid one.
   *
   * @param pollingTokenType
   * @returns true if valid, false otherwise.
   */
  #isValidPollingTokenType(pollingTokenType: PollingTokenType): boolean {
    const validTokenTypes: PollingTokenType[] = [
      'popupGasPollTokens',
      'notificationGasPollTokens',
      'fullScreenGasPollTokens',
    ];

    return validTokenTypes.includes(pollingTokenType);
  }

  /**
   * clears all pollingTokens
   */
  clearPollingTokens(): void {
    this.update((state) => {
      state.popupGasPollTokens = [];
      state.notificationGasPollTokens = [];
      state.fullScreenGasPollTokens = [];
    });
  }

  /**
   * Sets whether the testnet dismissal link should be shown in the network dropdown
   *
   * @param showTestnetMessageInDropdown
   */
  setShowTestnetMessageInDropdown(showTestnetMessageInDropdown: boolean): void {
    this.update((state) => {
      state.showTestnetMessageInDropdown = showTestnetMessageInDropdown;
    });
  }

  /**
   * Sets whether the beta notification heading on the home page
   *
   * @param showBetaHeader
   */
  setShowBetaHeader(showBetaHeader: boolean): void {
    this.update((state) => {
      state.showBetaHeader = showBetaHeader;
    });
  }

  /**
   * Sets whether the permissions tour should be shown to the user
   *
   * @param showPermissionsTour
   */
  setShowPermissionsTour(showPermissionsTour: boolean): void {
    this.update((state) => {
      state.showPermissionsTour = showPermissionsTour;
    });
  }

  /**
   * Sets whether the Network Banner should be shown
   *
   * @param showNetworkBanner
   */
  setShowNetworkBanner(showNetworkBanner: boolean): void {
    this.update((state) => {
      state.showNetworkBanner = showNetworkBanner;
    });
  }

  /**
   * Sets whether the Account Banner should be shown
   *
   * @param showAccountBanner
   */
  setShowAccountBanner(showAccountBanner: boolean): void {
    this.update((state) => {
      state.showAccountBanner = showAccountBanner;
    });
  }

  /**
   * Sets a unique ID for the current extension popup
   *
   * @param currentExtensionPopupId
   */
  setCurrentExtensionPopupId(currentExtensionPopupId: number): void {
    this.update((state) => {
      state.currentExtensionPopupId = currentExtensionPopupId;
    });
  }

  /**
   * Sets an object with networkName and appName
   * or `null` if the message is meant to be cleared
   *
   * @param switchedNetworkDetails - Details about the network that MetaMask just switched to.
   */
  setSwitchedNetworkDetails(
    switchedNetworkDetails: { origin: string; networkClientId: string } | null,
  ): void {
    this.update((state) => {
      state.switchedNetworkDetails = switchedNetworkDetails;
    });
  }

  /**
   * Clears the switched network details in state
   */
  clearSwitchedNetworkDetails(): void {
    this.update((state) => {
      state.switchedNetworkDetails = null;
    });
  }

  /**
   * Remembers if the user prefers to never see the
   * network switched message again
   *
   * @param switchedNetworkNeverShowMessage
   */
  setSwitchedNetworkNeverShowMessage(
    switchedNetworkNeverShowMessage: boolean,
  ): void {
    this.update((state) => {
      state.switchedNetworkDetails = null;
      state.switchedNetworkNeverShowMessage = switchedNetworkNeverShowMessage;
    });
  }

  /**
   * Sets a property indicating the model of the user's Trezor hardware wallet
   *
   * @param trezorModel - The Trezor model.
   */
  setTrezorModel(trezorModel: string | null): void {
    this.update((state) => {
      state.trezorModel = trezorModel;
    });
  }

  /**
   * A setter for the `nftsDropdownState` property
   *
   * @param nftsDropdownState
   */
  updateNftDropDownState(nftsDropdownState: Json): void {
    this.update((state) => {
      state.nftsDropdownState = nftsDropdownState;
    });
  }

  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  /**
   * Set the interactive replacement token with a url and the old refresh token
   *
   * @param opts
   * @param opts.url
   * @param opts.oldRefreshToken
   */
  showInteractiveReplacementTokenBanner({
    url,
    oldRefreshToken,
  }: {
    url: string;
    oldRefreshToken: string;
  }): void {
    this.update((state) => {
      state.interactiveReplacementToken = {
        url,
        oldRefreshToken,
      };
    });
  }

  /**
   * Set the setCustodianDeepLink with the fromAddress and custodyId
   *
   * @param opts
   * @param opts.fromAddress
   * @param opts.custodyId
   */
  setCustodianDeepLink({
    fromAddress,
    custodyId,
  }: {
    fromAddress: string;
    custodyId: string;
  }): void {
    this.update((state) => {
      state.custodianDeepLink = { fromAddress, custodyId };
    });
  }

  setNoteToTraderMessage(message: string): void {
    this.update((state) => {
      state.noteToTraderMessage = message;
    });
  }

  ///: END:ONLY_INCLUDE_IF

  getSignatureSecurityAlertResponse(
    securityAlertId: string,
  ): SecurityAlertResponse {
    return this.state.signatureSecurityAlertResponses[securityAlertId];
  }

  addSignatureSecurityAlertResponse(
    securityAlertResponse: SecurityAlertResponse,
  ): void {
    if (securityAlertResponse.securityAlertId) {
      this.update((state) => {
        state.signatureSecurityAlertResponses[
          String(securityAlertResponse.securityAlertId)
        ] = securityAlertResponse;
      });
    }
  }

  /**
   * A setter for the currentPopupId which indicates the id of popup window that's currently active
   *
   * @param currentPopupId
   */
  setCurrentPopupId(currentPopupId: number): void {
    this.update((state) => {
      state.currentPopupId = currentPopupId;
    });
  }

  /**
   * The function returns information about the last confirmation user interacted with
   */
  getLastInteractedConfirmationInfo():
    | LastInteractedConfirmationInfo
    | undefined {
    return this.state.lastInteractedConfirmationInfo;
  }

  /**
   * Update the information about the last confirmation user interacted with
   *
   * @param lastInteractedConfirmationInfo
   */
  setLastInteractedConfirmationInfo(
    lastInteractedConfirmationInfo: LastInteractedConfirmationInfo | undefined,
  ): void {
    this.update((state) => {
      state.lastInteractedConfirmationInfo = lastInteractedConfirmationInfo;
    });
  }

  /**
   * A getter to retrieve currentPopupId saved in the appState
   */
  getCurrentPopupId(): number | undefined {
    return this.state.currentPopupId;
  }

  #requestApproval(): void {
    // If we already have a pending request this is a no-op
    if (this.#approvalRequestId) {
      return;
    }
    this.#approvalRequestId = uuid();

    this.messagingSystem
      .call(
        'ApprovalController:addRequest',
        {
          id: this.#approvalRequestId,
          origin: ORIGIN_METAMASK,
          type: ApprovalType.Unlock,
        },
        true,
      )
      .catch(() => {
        // If the promise fails, we allow a new popup to be triggered
        this.#approvalRequestId = null;
      });
  }

  #acceptApproval(): void {
    if (!this.#approvalRequestId) {
      return;
    }
    try {
      this.messagingSystem.call(
        'ApprovalController:acceptRequest',
        this.#approvalRequestId,
      );
    } catch (error) {
      log.error('Failed to unlock approval request', error);
    }

    this.#approvalRequestId = null;
  }
}
