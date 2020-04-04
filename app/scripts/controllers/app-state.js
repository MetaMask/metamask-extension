import ObservableStore from 'obs-store'
import EventEmitter from 'events'

class AppStateController extends EventEmitter {
  /**
   * @constructor
   * @param opts
   */
  constructor (opts = {}) {
    const {
      addUnlockListener,
      isUnlocked,
      initState,
      onInactiveTimeout,
      preferencesStore,
    } = opts
    const { preferences } = preferencesStore.getState()

    super()

    this.onInactiveTimeout = onInactiveTimeout || (() => {})
    this.store = new ObservableStore(Object.assign({
      timeoutMinutes: 0,
      mkrMigrationReminderTimestamp: null,
      connectedStatusPopoverHasBeenShown: true,
    }, initState))
    this.timer = null

    this.isUnlocked = isUnlocked
    this.waitingForUnlock = []
    addUnlockListener(this.handleUnlock.bind(this))

    preferencesStore.subscribe((state) => {
      this._setInactiveTimeout(state.preferences.autoLockTimeLimit)
    })

    this._setInactiveTimeout(preferences.autoLockTimeLimit)
  }

  /**
   * Get a Promise that resolves when the extension is unlocked.
   * This Promise will never reject.
   *
   * @returns {Promise<void>} A promise that resolves when the extension is
   * unlocked, or immediately if the extension is already unlocked.
   */
  getUnlockPromise () {
    return new Promise((resolve) => {
      if (this.isUnlocked()) {
        resolve()
      } else {
        this.waitingForUnlock.push({ resolve })
        this.emit('updateBadge')
      }
    })
  }

  /**
   * Drains the waitingForUnlock queue, resolving all the related Promises.
   */
  handleUnlock () {
    if (this.waitingForUnlock.length > 0) {
      while (this.waitingForUnlock.length > 0) {
        this.waitingForUnlock.shift().resolve()
      }
      this.emit('updateBadge')
    }
  }

  setMkrMigrationReminderTimestamp (timestamp) {
    this.store.updateState({
      mkrMigrationReminderTimestamp: timestamp,
    })
  }

  /**
   * Record that the user has seen the connected status info popover
   */
  setConnectedStatusPopoverHasBeenShown () {
    this.store.updateState({
      connectedStatusPopoverHasBeenShown: true,
    })
  }

  /**
   * Sets the last active time to the current time
   * @returns {void}
   */
  setLastActiveTime () {
    this._resetTimer()
  }

  /**
   * Sets the inactive timeout for the app
   * @param {number} timeoutMinutes - the inactive timeout in minutes
   * @returns {void}
   * @private
   */
  _setInactiveTimeout (timeoutMinutes) {
    this.store.updateState({
      timeoutMinutes,
    })

    this._resetTimer()
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
  _resetTimer () {
    const { timeoutMinutes } = this.store.getState()

    if (this.timer) {
      clearTimeout(this.timer)
    }

    if (!timeoutMinutes) {
      return
    }

    this.timer = setTimeout(() => this.onInactiveTimeout(), timeoutMinutes * 60 * 1000)
  }
}

export default AppStateController

