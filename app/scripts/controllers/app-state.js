import EventEmitter from 'events';
import { ObservableStore } from '@metamask/obs-store';
import { v4 as uuid } from 'uuid';
import log from 'loglevel';
import { ApprovalType } from '@metamask/controller-utils';
import { METAMASK_CONTROLLER_EVENTS } from '../metamask-controller';
import { MINUTE } from '../../../shared/constants/time';
import { AUTO_LOCK_TIMEOUT_ALARM } from '../../../shared/constants/alarms';
import { isManifestV3 } from '../../../shared/modules/mv3.utils';
import { isBeta } from '../../../ui/helpers/utils/build-types';
import {
  ENVIRONMENT_TYPE_BACKGROUND,
  POLLING_TOKEN_ENVIRONMENT_TYPES,
  ORIGIN_METAMASK,
} from '../../../shared/constants/app';
import { DEFAULT_AUTO_LOCK_TIME_LIMIT } from '../../../shared/constants/preferences';

export default class AppStateController extends EventEmitter {
  /**
   * @param {object} opts
   */
  constructor(opts = {}) {
    const {
      addUnlockListener,
      isUnlocked,
      initState,
      onInactiveTimeout,
      preferencesStore,
      messenger,
      extension,
    } = opts;
    super();

    this.extension = extension;
    this.onInactiveTimeout = onInactiveTimeout || (() => undefined);
    this.store = new ObservableStore({
      timeoutMinutes: DEFAULT_AUTO_LOCK_TIME_LIMIT,
      connectedStatusPopoverHasBeenShown: true,
      defaultHomeActiveTabName: null,
      browserEnvironment: {},
      popupGasPollTokens: [],
      notificationGasPollTokens: [],
      fullScreenGasPollTokens: [],
      recoveryPhraseReminderHasBeenShown: false,
      recoveryPhraseReminderLastShown: new Date().getTime(),
      outdatedBrowserWarningLastShown: new Date().getTime(),
      nftsDetectionNoticeDismissed: false,
      showTestnetMessageInDropdown: true,
      showBetaHeader: isBeta(),
      showProductTour: true,
      trezorModel: null,
      currentPopupId: undefined,
      // This key is only used for checking if the user had set advancedGasFee
      // prior to Migration 92.3 where we split out the setting to support
      // multiple networks.
      hadAdvancedGasFeesSetPriorToMigration92_3: false,
      ...initState,
      qrHardware: {},
      nftsDropdownState: {},
      usedNetworks: {
        '0x1': true,
        '0x5': true,
        '0x539': true,
      },
    });
    this.timer = null;

    this.isUnlocked = isUnlocked;
    this.waitingForUnlock = [];
    addUnlockListener(this.handleUnlock.bind(this));

    preferencesStore.subscribe(({ preferences }) => {
      const currentState = this.store.getState();
      if (currentState.timeoutMinutes !== preferences.autoLockTimeLimit) {
        this._setInactiveTimeout(preferences.autoLockTimeLimit);
      }
    });

    messenger.subscribe(
      'KeyringController:qrKeyringStateChange',
      (qrHardware) =>
        this.store.updateState({
          qrHardware,
        }),
    );

    const { preferences } = preferencesStore.getState();
    this._setInactiveTimeout(preferences.autoLockTimeLimit);

    this.messagingSystem = messenger;
    this._approvalRequestId = null;
  }

  /**
   * Get a Promise that resolves when the extension is unlocked.
   * This Promise will never reject.
   *
   * @param {boolean} shouldShowUnlockRequest - Whether the extension notification
   * popup should be opened.
   * @returns {Promise<void>} A promise that resolves when the extension is
   * unlocked, or immediately if the extension is already unlocked.
   */
  getUnlockPromise(shouldShowUnlockRequest) {
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
   * @param {Promise.resolve} resolve - A Promise's resolve function that will
   * be called when the extension is unlocked.
   * @param {boolean} shouldShowUnlockRequest - Whether the extension notification
   * popup should be opened.
   */
  waitForUnlock(resolve, shouldShowUnlockRequest) {
    this.waitingForUnlock.push({ resolve });
    this.emit(METAMASK_CONTROLLER_EVENTS.UPDATE_BADGE);
    if (shouldShowUnlockRequest) {
      this._requestApproval();
    }
  }

  /**
   * Drains the waitingForUnlock queue, resolving all the related Promises.
   */
  handleUnlock() {
    if (this.waitingForUnlock.length > 0) {
      while (this.waitingForUnlock.length > 0) {
        this.waitingForUnlock.shift().resolve();
      }
      this.emit(METAMASK_CONTROLLER_EVENTS.UPDATE_BADGE);
    }

    this._acceptApproval();
  }

  /**
   * Sets the default home tab
   *
   * @param {string} [defaultHomeActiveTabName] - the tab name
   */
  setDefaultHomeActiveTabName(defaultHomeActiveTabName) {
    this.store.updateState({
      defaultHomeActiveTabName,
    });
  }

  /**
   * Record that the user has seen the connected status info popover
   */
  setConnectedStatusPopoverHasBeenShown() {
    this.store.updateState({
      connectedStatusPopoverHasBeenShown: true,
    });
  }

  /**
   * Record that the user has been shown the recovery phrase reminder.
   */
  setRecoveryPhraseReminderHasBeenShown() {
    this.store.updateState({
      recoveryPhraseReminderHasBeenShown: true,
    });
  }

  /**
   * Record the timestamp of the last time the user has seen the recovery phrase reminder
   *
   * @param {number} lastShown - timestamp when user was last shown the reminder.
   */
  setRecoveryPhraseReminderLastShown(lastShown) {
    this.store.updateState({
      recoveryPhraseReminderLastShown: lastShown,
    });
  }

  /**
   * Record the timestamp of the last time the user has acceoted the terms of use
   *
   * @param {number} lastAgreed - timestamp when user last accepted the terms of use
   */
  setTermsOfUseLastAgreed(lastAgreed) {
    this.store.updateState({
      termsOfUseLastAgreed: lastAgreed,
    });
  }

  ///: BEGIN:ONLY_INCLUDE_IF(snaps)
  /**
   * Record if popover for snaps privacy warning has been shown
   * on the first install of a snap.
   *
   * @param {boolean} shown - shown status
   */
  setSnapsInstallPrivacyWarningShownStatus(shown) {
    this.store.updateState({
      snapsInstallPrivacyWarningShown: shown,
    });
  }
  ///: END:ONLY_INCLUDE_IF

  /**
   * Record the timestamp of the last time the user has seen the outdated browser warning
   *
   * @param {number} lastShown - Timestamp (in milliseconds) of when the user was last shown the warning.
   */
  setOutdatedBrowserWarningLastShown(lastShown) {
    this.store.updateState({
      outdatedBrowserWarningLastShown: lastShown,
    });
  }

  /**
   * Sets the last active time to the current time.
   */
  setLastActiveTime() {
    this._resetTimer();
  }

  /**
   * Sets the inactive timeout for the app
   *
   * @private
   * @param {number} timeoutMinutes - The inactive timeout in minutes.
   */
  _setInactiveTimeout(timeoutMinutes) {
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
   * @private
   */
  /* eslint-disable no-undef */
  _resetTimer() {
    const { timeoutMinutes } = this.store.getState();

    if (this.timer) {
      clearTimeout(this.timer);
    } else if (isManifestV3) {
      this.extension.alarms.clear(AUTO_LOCK_TIMEOUT_ALARM);
    }

    if (!timeoutMinutes) {
      return;
    }

    if (isManifestV3) {
      this.extension.alarms.create(AUTO_LOCK_TIMEOUT_ALARM, {
        delayInMinutes: timeoutMinutes,
        periodInMinutes: timeoutMinutes,
      });
      this.extension.alarms.onAlarm.addListener((alarmInfo) => {
        if (alarmInfo.name === AUTO_LOCK_TIMEOUT_ALARM) {
          this.onInactiveTimeout();
          this.extension.alarms.clear(AUTO_LOCK_TIMEOUT_ALARM);
        }
      });
    } else {
      this.timer = setTimeout(
        () => this.onInactiveTimeout(),
        timeoutMinutes * MINUTE,
      );
    }
  }

  /**
   * Sets the current browser and OS environment
   *
   * @param os
   * @param browser
   */
  setBrowserEnvironment(os, browser) {
    this.store.updateState({ browserEnvironment: { os, browser } });
  }

  /**
   * Adds a pollingToken for a given environmentType
   *
   * @param pollingToken
   * @param pollingTokenType
   */
  addPollingToken(pollingToken, pollingTokenType) {
    if (
      pollingTokenType !==
      POLLING_TOKEN_ENVIRONMENT_TYPES[ENVIRONMENT_TYPE_BACKGROUND]
    ) {
      const prevState = this.store.getState()[pollingTokenType];
      this.store.updateState({
        [pollingTokenType]: [...prevState, pollingToken],
      });
    }
  }

  /**
   * removes a pollingToken for a given environmentType
   *
   * @param pollingToken
   * @param pollingTokenType
   */
  removePollingToken(pollingToken, pollingTokenType) {
    if (
      pollingTokenType !==
      POLLING_TOKEN_ENVIRONMENT_TYPES[ENVIRONMENT_TYPE_BACKGROUND]
    ) {
      const prevState = this.store.getState()[pollingTokenType];
      this.store.updateState({
        [pollingTokenType]: prevState.filter((token) => token !== pollingToken),
      });
    }
  }

  /**
   * clears all pollingTokens
   */
  clearPollingTokens() {
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
  setShowTestnetMessageInDropdown(showTestnetMessageInDropdown) {
    this.store.updateState({ showTestnetMessageInDropdown });
  }

  /**
   * Sets whether the beta notification heading on the home page
   *
   * @param showBetaHeader
   */
  setShowBetaHeader(showBetaHeader) {
    this.store.updateState({ showBetaHeader });
  }

  /**
   * Sets whether the product tour should be shown
   *
   * @param showProductTour
   */
  setShowProductTour(showProductTour) {
    this.store.updateState({ showProductTour });
  }

  /**
   * Sets a property indicating the model of the user's Trezor hardware wallet
   *
   * @param trezorModel - The Trezor model.
   */
  setTrezorModel(trezorModel) {
    this.store.updateState({ trezorModel });
  }

  /**
   * A setter for the `nftsDropdownState` property
   *
   * @param nftsDropdownState
   */
  updateNftDropDownState(nftsDropdownState) {
    this.store.updateState({
      nftsDropdownState,
    });
  }

  /**
   * Updates the array of the first time used networks
   *
   * @param chainId
   * @returns {void}
   */
  setFirstTimeUsedNetwork(chainId) {
    const currentState = this.store.getState();
    const { usedNetworks } = currentState;
    usedNetworks[chainId] = true;

    this.store.updateState({ usedNetworks });
  }

  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  /**
   * Set the interactive replacement token with a url and the old refresh token
   *
   * @param {object} opts
   * @param opts.url
   * @param opts.oldRefreshToken
   * @returns {void}
   */
  showInteractiveReplacementTokenBanner({ url, oldRefreshToken }) {
    this.store.updateState({
      interactiveReplacementToken: {
        url,
        oldRefreshToken,
      },
    });
  }

  ///: END:ONLY_INCLUDE_IF
  /**
   * A setter for the currentPopupId which indicates the id of popup window that's currently active
   *
   * @param currentPopupId
   */
  setCurrentPopupId(currentPopupId) {
    this.store.updateState({
      currentPopupId,
    });
  }

  /**
   * A getter to retrieve currentPopupId saved in the appState
   */
  getCurrentPopupId() {
    return this.store.getState().currentPopupId;
  }

  _requestApproval() {
    this._approvalRequestId = uuid();

    this.messagingSystem
      .call(
        'ApprovalController:addRequest',
        {
          id: this._approvalRequestId,
          origin: ORIGIN_METAMASK,
          type: ApprovalType.Unlock,
        },
        true,
      )
      .catch(() => {
        // Intentionally ignored as promise not currently used
      });
  }

  _acceptApproval() {
    if (!this._approvalRequestId) {
      return;
    }
    try {
      this.messagingSystem.call(
        'ApprovalController:acceptRequest',
        this._approvalRequestId,
      );
    } catch (error) {
      log.error('Failed to unlock approval request', error);
    }

    this._approvalRequestId = null;
  }
}
