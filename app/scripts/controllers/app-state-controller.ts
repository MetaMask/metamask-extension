import EventEmitter from 'events';
import { ObservableStore } from '@metamask/obs-store';
import { v4 as uuid } from 'uuid';
import log from 'loglevel';
import { ApprovalType } from '@metamask/controller-utils';
import { KeyringControllerQRKeyringStateChangeEvent } from '@metamask/keyring-controller';
import { RestrictedControllerMessenger } from '@metamask/base-controller';
import {
  AcceptRequest,
  AddApprovalRequest,
} from '@metamask/approval-controller';
import { Json } from '@metamask/utils';
import { Browser } from 'webextension-polyfill';
import { METAMASK_CONTROLLER_EVENTS } from '../metamask-controller';
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
import type {
  Preferences,
  PreferencesControllerGetStateAction,
  PreferencesControllerStateChangeEvent,
} from './preferences-controller';

export type AppStateControllerState = {
  timeoutMinutes: number;
  connectedStatusPopoverHasBeenShown: boolean;
  defaultHomeActiveTabName: string | null;
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
  usedNetworks: Record<string, boolean>;
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
};

const controllerName = 'AppStateController';

/**
 * Returns the state of the {@link AppStateController}.
 */
export type AppStateControllerGetStateAction = {
  type: 'AppStateController:getState';
  handler: () => AppStateControllerState;
};

/**
 * Actions exposed by the {@link AppStateController}.
 */
export type AppStateControllerActions = AppStateControllerGetStateAction;

/**
 * Actions that this controller is allowed to call.
 */
export type AllowedActions =
  | AddApprovalRequest
  | AcceptRequest
  | PreferencesControllerGetStateAction;

/**
 * Event emitted when the state of the {@link AppStateController} changes.
 */
export type AppStateControllerStateChangeEvent = {
  type: 'AppStateController:stateChange';
  payload: [AppStateControllerState, []];
};

/**
 * Events emitted by {@link AppStateController}.
 */
export type AppStateControllerEvents = AppStateControllerStateChangeEvent;

/**
 * Events that this controller is allowed to subscribe.
 */
export type AllowedEvents =
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
    | 'usedNetworks'
    | 'surveyLinkLastClickedOrClosed'
    | 'signatureSecurityAlertResponses'
    | 'switchedNetworkDetails'
    | 'switchedNetworkNeverShowMessage'
    | 'currentExtensionPopupId'
  >
>;

type AppStateControllerOptions = {
  addUnlockListener: (callback: () => void) => void;
  isUnlocked: () => boolean;
  initState?: AppStateControllerInitState;
  onInactiveTimeout?: () => void;
  messenger: AppStateControllerMessenger;
  extension: Browser;
};

const getDefaultAppStateControllerState = (
  initState?: AppStateControllerInitState,
): AppStateControllerState => ({
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
  ...initState,
  qrHardware: {},
  nftsDropdownState: {},
  usedNetworks: {
    '0x1': true,
    '0x5': true,
    '0x539': true,
  },
  surveyLinkLastClickedOrClosed: null,
  signatureSecurityAlertResponses: {},
  switchedNetworkDetails: null,
  switchedNetworkNeverShowMessage: false,
  currentExtensionPopupId: 0,
});

export class AppStateController extends EventEmitter {
  private extension: AppStateControllerOptions['extension'];

  private onInactiveTimeout: () => void;

  store: ObservableStore<AppStateControllerState>;

  private timer: NodeJS.Timeout | null;

  private isUnlocked: () => boolean;

  private waitingForUnlock: { resolve: () => void }[];

  private messagingSystem: AppStateControllerMessenger;

  #approvalRequestId: string | null;

  constructor(opts: AppStateControllerOptions) {
    const {
      addUnlockListener,
      isUnlocked,
      initState,
      onInactiveTimeout,
      messenger,
      extension,
    } = opts;
    super();

    this.extension = extension;
    this.onInactiveTimeout = onInactiveTimeout || (() => undefined);
    this.store = new ObservableStore(
      getDefaultAppStateControllerState(initState),
    );
    this.timer = null;

    this.isUnlocked = isUnlocked;
    this.waitingForUnlock = [];
    addUnlockListener(this.handleUnlock.bind(this));

    messenger.subscribe(
      'PreferencesController:stateChange',
      ({ preferences }: { preferences: Partial<Preferences> }) => {
        const currentState = this.store.getState();
        if (
          preferences?.autoLockTimeLimit &&
          currentState.timeoutMinutes !== preferences.autoLockTimeLimit
        ) {
          this._setInactiveTimeout(preferences.autoLockTimeLimit);
        }
      },
    );

    messenger.subscribe(
      'KeyringController:qrKeyringStateChange',
      (qrHardware: Json) =>
        this.store.updateState({
          qrHardware,
        }),
    );

    const { preferences } = messenger.call('PreferencesController:getState');

    if (preferences.autoLockTimeLimit) {
      this._setInactiveTimeout(preferences.autoLockTimeLimit);
    }

    this.messagingSystem = messenger;
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
        this.waitForUnlock(resolve, shouldShowUnlockRequest);
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
  waitForUnlock(resolve: () => void, shouldShowUnlockRequest: boolean): void {
    this.waitingForUnlock.push({ resolve });
    this.emit(METAMASK_CONTROLLER_EVENTS.UPDATE_BADGE);
    if (shouldShowUnlockRequest) {
      this._requestApproval();
    }
  }

  /**
   * Drains the waitingForUnlock queue, resolving all the related Promises.
   */
  handleUnlock(): void {
    if (this.waitingForUnlock.length > 0) {
      while (this.waitingForUnlock.length > 0) {
        this.waitingForUnlock.shift()?.resolve();
      }
      this.emit(METAMASK_CONTROLLER_EVENTS.UPDATE_BADGE);
    }

    this._acceptApproval();
  }

  /**
   * Sets the default home tab
   *
   * @param [defaultHomeActiveTabName] - the tab name
   */
  setDefaultHomeActiveTabName(defaultHomeActiveTabName: string | null): void {
    this.store.updateState({
      defaultHomeActiveTabName,
    });
  }

  /**
   * Record that the user has seen the connected status info popover
   */
  setConnectedStatusPopoverHasBeenShown(): void {
    this.store.updateState({
      connectedStatusPopoverHasBeenShown: true,
    });
  }

  /**
   * Record that the user has been shown the recovery phrase reminder.
   */
  setRecoveryPhraseReminderHasBeenShown(): void {
    this.store.updateState({
      recoveryPhraseReminderHasBeenShown: true,
    });
  }

  setSurveyLinkLastClickedOrClosed(time: number): void {
    this.store.updateState({
      surveyLinkLastClickedOrClosed: time,
    });
  }

  setOnboardingDate(): void {
    this.store.updateState({
      onboardingDate: Date.now(),
    });
  }

  setLastViewedUserSurvey(id: number) {
    this.store.updateState({
      lastViewedUserSurvey: id,
    });
  }

  setNewPrivacyPolicyToastClickedOrClosed(): void {
    this.store.updateState({
      newPrivacyPolicyToastClickedOrClosed: true,
    });
  }

  setNewPrivacyPolicyToastShownDate(time: number): void {
    this.store.updateState({
      newPrivacyPolicyToastShownDate: time,
    });
  }

  /**
   * Record the timestamp of the last time the user has seen the recovery phrase reminder
   *
   * @param lastShown - timestamp when user was last shown the reminder.
   */
  setRecoveryPhraseReminderLastShown(lastShown: number): void {
    this.store.updateState({
      recoveryPhraseReminderLastShown: lastShown,
    });
  }

  /**
   * Record the timestamp of the last time the user has acceoted the terms of use
   *
   * @param lastAgreed - timestamp when user last accepted the terms of use
   */
  setTermsOfUseLastAgreed(lastAgreed: number): void {
    this.store.updateState({
      termsOfUseLastAgreed: lastAgreed,
    });
  }

  /**
   * Record if popover for snaps privacy warning has been shown
   * on the first install of a snap.
   *
   * @param shown - shown status
   */
  setSnapsInstallPrivacyWarningShownStatus(shown: boolean): void {
    this.store.updateState({
      snapsInstallPrivacyWarningShown: shown,
    });
  }

  /**
   * Record the timestamp of the last time the user has seen the outdated browser warning
   *
   * @param lastShown - Timestamp (in milliseconds) of when the user was last shown the warning.
   */
  setOutdatedBrowserWarningLastShown(lastShown: number): void {
    this.store.updateState({
      outdatedBrowserWarningLastShown: lastShown,
    });
  }

  /**
   * Sets the last active time to the current time.
   */
  setLastActiveTime(): void {
    this._resetTimer();
  }

  /**
   * Sets the inactive timeout for the app
   *
   * @param timeoutMinutes - The inactive timeout in minutes.
   */
  private _setInactiveTimeout(timeoutMinutes: number): void {
    this.store.updateState({
      timeoutMinutes,
    });

    this._resetTimer();
  }

  /**
   * Resets the internal inactive timer
   *
   * If the {@code timeoutMinutes} state is falsy (i.e., zero) then a new
   * timer will not be created.
   *
   */
  private _resetTimer(): void {
    const { timeoutMinutes } = this.store.getState();

    if (this.timer) {
      clearTimeout(this.timer);
    } else if (isManifestV3) {
      this.extension.alarms.clear(AUTO_LOCK_TIMEOUT_ALARM);
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
      this.extension.alarms.create(AUTO_LOCK_TIMEOUT_ALARM, {
        delayInMinutes: timeoutToSet,
        periodInMinutes: timeoutToSet,
      });
      this.extension.alarms.onAlarm.addListener(
        (alarmInfo: { name: string }) => {
          if (alarmInfo.name === AUTO_LOCK_TIMEOUT_ALARM) {
            this.onInactiveTimeout();
            this.extension.alarms.clear(AUTO_LOCK_TIMEOUT_ALARM);
          }
        },
      );
    } else {
      this.timer = setTimeout(
        () => this.onInactiveTimeout(),
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
    this.store.updateState({ browserEnvironment: { os, browser } });
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
    const currentTokens: string[] = this.store.getState()[pollingTokenType];
    this.store.updateState({
      [pollingTokenType]: [...currentTokens, pollingToken],
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
      const currentTokens: string[] = this.store.getState()[pollingTokenType];
      if (this.#isValidPollingTokenType(pollingTokenType)) {
        this.store.updateState({
          [pollingTokenType]: currentTokens.filter(
            (token: string) => token !== pollingToken,
          ),
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
    this.store.updateState({
      popupGasPollTokens: [],
      notificationGasPollTokens: [],
      fullScreenGasPollTokens: [],
    });
  }

  /**
   * Sets whether the testnet dismissal link should be shown in the network dropdown
   *
   * @param showTestnetMessageInDropdown
   */
  setShowTestnetMessageInDropdown(showTestnetMessageInDropdown: boolean): void {
    this.store.updateState({ showTestnetMessageInDropdown });
  }

  /**
   * Sets whether the beta notification heading on the home page
   *
   * @param showBetaHeader
   */
  setShowBetaHeader(showBetaHeader: boolean): void {
    this.store.updateState({ showBetaHeader });
  }

  /**
   * Sets whether the permissions tour should be shown to the user
   *
   * @param showPermissionsTour
   */
  setShowPermissionsTour(showPermissionsTour: boolean): void {
    this.store.updateState({ showPermissionsTour });
  }

  /**
   * Sets whether the Network Banner should be shown
   *
   * @param showNetworkBanner
   */
  setShowNetworkBanner(showNetworkBanner: boolean): void {
    this.store.updateState({ showNetworkBanner });
  }

  /**
   * Sets whether the Account Banner should be shown
   *
   * @param showAccountBanner
   */
  setShowAccountBanner(showAccountBanner: boolean): void {
    this.store.updateState({ showAccountBanner });
  }

  /**
   * Sets a unique ID for the current extension popup
   *
   * @param currentExtensionPopupId
   */
  setCurrentExtensionPopupId(currentExtensionPopupId: number): void {
    this.store.updateState({ currentExtensionPopupId });
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
    this.store.updateState({ switchedNetworkDetails });
  }

  /**
   * Clears the switched network details in state
   */
  clearSwitchedNetworkDetails(): void {
    this.store.updateState({ switchedNetworkDetails: null });
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
    this.store.updateState({
      switchedNetworkDetails: null,
      switchedNetworkNeverShowMessage,
    });
  }

  /**
   * Sets a property indicating the model of the user's Trezor hardware wallet
   *
   * @param trezorModel - The Trezor model.
   */
  setTrezorModel(trezorModel: string | null): void {
    this.store.updateState({ trezorModel });
  }

  /**
   * A setter for the `nftsDropdownState` property
   *
   * @param nftsDropdownState
   */
  updateNftDropDownState(nftsDropdownState: Json): void {
    this.store.updateState({
      nftsDropdownState,
    });
  }

  /**
   * Updates the array of the first time used networks
   *
   * @param chainId
   */
  setFirstTimeUsedNetwork(chainId: string): void {
    const currentState = this.store.getState();
    const { usedNetworks } = currentState;
    usedNetworks[chainId] = true;

    this.store.updateState({ usedNetworks });
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
    this.store.updateState({
      interactiveReplacementToken: {
        url,
        oldRefreshToken,
      },
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
    this.store.updateState({
      custodianDeepLink: { fromAddress, custodyId },
    });
  }

  setNoteToTraderMessage(message: string): void {
    this.store.updateState({
      noteToTraderMessage: message,
    });
  }

  ///: END:ONLY_INCLUDE_IF

  getSignatureSecurityAlertResponse(
    securityAlertId: string,
  ): SecurityAlertResponse {
    return this.store.getState().signatureSecurityAlertResponses[
      securityAlertId
    ];
  }

  addSignatureSecurityAlertResponse(
    securityAlertResponse: SecurityAlertResponse,
  ): void {
    const currentState = this.store.getState();
    const { signatureSecurityAlertResponses } = currentState;
    if (securityAlertResponse.securityAlertId) {
      this.store.updateState({
        signatureSecurityAlertResponses: {
          ...signatureSecurityAlertResponses,
          [String(securityAlertResponse.securityAlertId)]:
            securityAlertResponse,
        },
      });
    }
  }

  /**
   * A setter for the currentPopupId which indicates the id of popup window that's currently active
   *
   * @param currentPopupId
   */
  setCurrentPopupId(currentPopupId: number): void {
    this.store.updateState({
      currentPopupId,
    });
  }

  /**
   * The function returns information about the last confirmation user interacted with
   *
   * @type {LastInteractedConfirmationInfo}: Information about the last confirmation user interacted with.
   */
  getLastInteractedConfirmationInfo():
    | LastInteractedConfirmationInfo
    | undefined {
    return this.store.getState().lastInteractedConfirmationInfo;
  }

  /**
   * Update the information about the last confirmation user interacted with
   *
   * @type {LastInteractedConfirmationInfo} - information about transaction user last interacted with.
   */
  setLastInteractedConfirmationInfo(
    lastInteractedConfirmationInfo: LastInteractedConfirmationInfo | undefined,
  ): void {
    this.store.updateState({
      lastInteractedConfirmationInfo,
    });
  }

  /**
   * A getter to retrieve currentPopupId saved in the appState
   */
  getCurrentPopupId(): number | undefined {
    return this.store.getState().currentPopupId;
  }

  private _requestApproval(): void {
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

  // Override emit method to provide strong typing for events
  emit(event: string) {
    return super.emit(event);
  }

  private _acceptApproval(): void {
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
