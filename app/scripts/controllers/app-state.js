const ObservableStore = require('obs-store')
const extend = require('xtend')

class AppStateController {
  /**
   * @constructor
   * @param opts
   */
  constructor (opts = {}) {
    const {initState, onInactiveTimeout, preferencesStore} = opts
    const {preferences} = preferencesStore.getState()

    this.onInactiveTimeout = onInactiveTimeout || (() => {})
    this.store = new ObservableStore(extend({
      timeoutMinutes: 0,
    }, initState))
    this.timer = null

    preferencesStore.subscribe(state => {
      this._setInactiveTimeout(state.preferences.autoLogoutTimeLimit)
    })

    this._setInactiveTimeout(preferences.autoLogoutTimeLimit)
  }

  /**
   * Sets the last active time to the current time
   * @return {void}
   */
  setLastActiveTime () {
    this._resetTimer()
  }

  /**
   * Sets the inactive timeout for the app
   * @param {number} timeoutMinutes the inactive timeout in minutes
   * @return {void}
   * @private
   */
  _setInactiveTimeout (timeoutMinutes) {
    this.store.putState({
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
   * @return {void}
   * @private
   */
  _resetTimer () {
    const {timeoutMinutes} = this.store.getState()

    if (this.timer) {
      clearTimeout(this.timer)
    }

    if (!timeoutMinutes) {
      return
    }

    this.timer = setTimeout(() => this.onInactiveTimeout(), timeoutMinutes * 60 * 1000)
  }
}

module.exports = AppStateController

