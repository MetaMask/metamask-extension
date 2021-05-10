import EventEmitter from 'events';
import { ObservableStore } from '@metamask/obs-store';
import { METAMASK_CONTROLLER_EVENTS } from '../metamask-controller';
import * as time from '../../../shared/constants/time';

// 1 hour
const REMINDER_CHECK_INTERVAL = time.HOUR;
// 2 days
const INITIAL_REMINDER_FREQUENCY = time.DAY * 2;
// 90 days
const FOLLOWUP_REMINDER_FREQUENCY = time.DAY * 90;

export default class AppStateController extends EventEmitter {
  /**
   * @constructor
   * @param {Object} opts
   */
  constructor(opts = {}) {
    const {
      addUnlockListener,
      isUnlocked,
      initState,
      onInactiveTimeout,
      showUnlockRequest,
      preferencesStore,
    } = opts;
    super();

    this.onInactiveTimeout = onInactiveTimeout || (() => undefined);
    this.store = new ObservableStore({
      timeoutMinutes: 0,
      connectedStatusPopoverHasBeenShown: true,
      defaultHomeActiveTabName: null,
      browserEnvironment: {},
      recoveryPhraseReminderHasBeenShown: false,
      recoveryPhraseReminderLastShown: 0,
      shouldShowRecoveryPhraseReminder: false,
      ...initState,
    });
    this.timer = null;
    this.interval = REMINDER_CHECK_INTERVAL;

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

    const { preferences } = preferencesStore.getState();
    this._setInactiveTimeout(preferences.autoLockTimeLimit);
  }

  /* eslint-disable accessor-pairs */
  /**
   * @type {number}
   */
  set interval(interval) {
    if (this._handleReminderCheck) {
      clearInterval(this._handleReminderCheck);
    }
    this._handleReminderCheck = setInterval(() => {
      this._checkShouldShowRecoveryPhraseReminder();
    }, interval);
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
   * Record that the user has been shown the recovery phrase reminder
   */
  setRecoveryPhraseReminderHasBeenShown() {
    this.store.updateState({
      recoveryPhraseReminderHasBeenShown: true,
      shouldShowRecoveryPhraseReminder: false,
    });
  }

  /**
   * Sets the last active time to the current time
   * @returns {void}
   */
  setLastActiveTime() {
    this._resetTimer();
  }

  /**
   * Sets the inactive timeout for the app
   * @param {number} timeoutMinutes - the inactive timeout in minutes
   * @returns {void}
   * @private
   */
  _setInactiveTimeout(timeoutMinutes) {
    this.store.updateState({
      timeoutMinutes,
    });

    this._resetTimer();
  }

  _checkShouldShowRecoveryPhraseReminder() {
    const {
      recoveryPhraseReminderHasBeenShown,
      recoveryPhraseReminderLastShown,
    } = this.store.getState();
    // Capture the current timestamp
    const currentTime = new Date().getTime();

    // For the first interval run, set recoveryPhraseReminderLastShown to the current time.
    if (recoveryPhraseReminderLastShown === 0) {
      this.store.updateState({
        recoveryPhraseReminderLastShown: currentTime,
      });
      return;
    }

    // Wait 2 days before the first display
    if (!recoveryPhraseReminderHasBeenShown) {
      if (
        currentTime - recoveryPhraseReminderLastShown >=
        INITIAL_REMINDER_FREQUENCY
      ) {
        this._setShouldShowRecoveryPhraseReminder(true);
        this._setRecoveryPhraseReminderLastShown(currentTime);
      }
      return;
    }

    // For subsequent displays, wait 90 days
    if (
      currentTime - recoveryPhraseReminderLastShown >=
      FOLLOWUP_REMINDER_FREQUENCY
    ) {
      this._setShouldShowRecoveryPhraseReminder(true);
      this._setRecoveryPhraseReminderLastShown(currentTime);
    }
  }

  /**
   * Record the timestamp of the last time the user has seen the recovery phrase reminder
   * @param {number} lastShown - timestamp when user was last shown the reminder
   * @returns {void}
   * @private
   */
  _setRecoveryPhraseReminderLastShown(lastShown) {
    this.store.updateState({
      recoveryPhraseReminderLastShown: lastShown,
    });
  }

  /**
   * Set whether or not the user should be shown the recovery phrase reminder
   * @param {boolean} shouldShow - whether or not the reminder should be shown
   * @returns {void}
   * @private
   */
  _setShouldShowRecoveryPhraseReminder(shouldShow) {
    this.store.updateState({
      shouldShowRecoveryPhraseReminder: shouldShow,
    });
  }

  /**
   * Resets the internal inactive timer
   *
   * If the {@code timeoutMinutes} state is falsy (i.e., zero) then a new
   * timer will not be created.
   *
   * @returns {void}
   * @private
   */
  _resetTimer() {
    const { timeoutMinutes } = this.store.getState();

    if (this.timer) {
      clearTimeout(this.timer);
    }

    if (!timeoutMinutes) {
      return;
    }

    this.timer = setTimeout(
      () => this.onInactiveTimeout(),
      timeoutMinutes * 60 * 1000,
    );
  }

  /**
   * Sets the current browser and OS environment
   * @returns {void}
   */
  setBrowserEnvironment(os, browser) {
    this.store.updateState({ browserEnvironment: { os, browser } });
  }
}
