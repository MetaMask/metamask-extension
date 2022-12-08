import EventEmitter from 'events';
import { ObservableStore } from '@metamask/obs-store';
import { METAMASK_CONTROLLER_EVENTS } from '../metamask-controller';
import { MINUTE } from '../../../shared/constants/time';
import { AUTO_LOCK_TIMEOUT_ALARM } from '../../../shared/constants/alarms';
import { isManifestV3 } from '../../../shared/modules/mv3.utils';
import { isBeta } from '../../../ui/helpers/utils/build-types';

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
      showUnlockRequest,
      preferencesStore,
      qrHardwareStore,
    } = opts;
    super();

    this.onInactiveTimeout = onInactiveTimeout || (() => undefined);
    this.store = new ObservableStore({
      timeoutMinutes: 0,
      connectedStatusPopoverHasBeenShown: true,
      defaultHomeActiveTabName: null,
      browserEnvironment: {},
      popupGasPollTokens: [],
      notificationGasPollTokens: [],
      fullScreenGasPollTokens: [],
      recoveryPhraseReminderHasBeenShown: false,
      recoveryPhraseReminderLastShown: new Date().getTime(),
      collectiblesDetectionNoticeDismissed: false,
      showTestnetMessageInDropdown: true,
      showPortfolioTooltip: true,
      showBetaHeader: isBeta(),
      trezorModel: null,
      ...initState,
      qrHardware: {},
      collectiblesDropdownState: {},
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

    this._showUnlockRequest = showUnlockRequest;

    preferencesStore.subscribe(({ preferences }) => {
      const currentState = this.store.getState();
      if (currentState.timeoutMinutes !== preferences.autoLockTimeLimit) {
        this._setInactiveTimeout(preferences.autoLockTimeLimit);
      }
    });

    qrHardwareStore.subscribe((state) => {
      this.store.updateState({ qrHardware: state });
    });

    const { preferences } = preferencesStore.getState();
    this._setInactiveTimeout(preferences.autoLockTimeLimit);
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
      this._showUnlockRequest();
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
      chrome.alarms.clear(AUTO_LOCK_TIMEOUT_ALARM);
    }

    if (!timeoutMinutes) {
      return;
    }

    if (isManifestV3) {
      chrome.alarms.create(AUTO_LOCK_TIMEOUT_ALARM, {
        delayInMinutes: timeoutMinutes,
        periodInMinutes: timeoutMinutes,
      });
      chrome.alarms.onAlarm.addListener((alarmInfo) => {
        if (alarmInfo.name === AUTO_LOCK_TIMEOUT_ALARM) {
          this.onInactiveTimeout();
          chrome.alarms.clear(AUTO_LOCK_TIMEOUT_ALARM);
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
    const prevState = this.store.getState()[pollingTokenType];
    this.store.updateState({
      [pollingTokenType]: [...prevState, pollingToken],
    });
  }

  /**
   * removes a pollingToken for a given environmentType
   *
   * @param pollingToken
   * @param pollingTokenType
   */
  removePollingToken(pollingToken, pollingTokenType) {
    const prevState = this.store.getState()[pollingTokenType];
    this.store.updateState({
      [pollingTokenType]: prevState.filter((token) => token !== pollingToken),
    });
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
   * Sets whether the portfolio site tooltip should be shown on the home page
   *
   * @param showPortfolioTooltip
   */
  setShowPortfolioTooltip(showPortfolioTooltip) {
    this.store.updateState({ showPortfolioTooltip });
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
   * Sets a property indicating the model of the user's Trezor hardware wallet
   *
   * @param trezorModel - The Trezor model.
   */
  setTrezorModel(trezorModel) {
    this.store.updateState({ trezorModel });
  }

  /**
   * A setter for the `collectiblesDetectionNoticeDismissed` property
   *
   * @param collectiblesDetectionNoticeDismissed
   */
  setCollectiblesDetectionNoticeDismissed(
    collectiblesDetectionNoticeDismissed,
  ) {
    this.store.updateState({
      collectiblesDetectionNoticeDismissed,
    });
  }

  /**
   * A setter for the `collectiblesDropdownState` property
   *
   * @param collectiblesDropdownState
   */
  updateCollectibleDropDownState(collectiblesDropdownState) {
    this.store.updateState({
      collectiblesDropdownState,
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
}
