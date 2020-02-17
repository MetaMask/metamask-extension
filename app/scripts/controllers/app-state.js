import ObservableStore from 'obs-store'

class AppStateController {
  /**
   * @constructor
   * @param opts
   */
  constructor (opts = {}) {
    const { initState, onInactiveTimeout, preferencesStore } = opts
    const { preferences } = preferencesStore.getState()

    this.onInactiveTimeout = onInactiveTimeout || (() => {})
    this.store = new ObservableStore(Object.assign({
      timeoutMinutes: 0,
      mkrMigrationReminderTimestamp: null,
    }, initState))
    this.timer = null

    preferencesStore.subscribe((state) => {
      this._setInactiveTimeout(state.preferences.autoLockTimeLimit)
    })

    this._setInactiveTimeout(preferences.autoLockTimeLimit)
  }

  setMkrMigrationReminderTimestamp (timestamp) {
    this.store.updateState({
      mkrMigrationReminderTimestamp: timestamp,
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

