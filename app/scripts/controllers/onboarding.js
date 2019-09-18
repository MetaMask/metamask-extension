const ObservableStore = require('obs-store')
const extend = require('xtend')
const clone = require('clone')

const defaultState = {
  seedPhraseBackedUp: true,
}
/**
 * @typedef {Object} InitState
 * @property {Boolean} seedPhraseBackedUp Indicates whether the user has completed the seed phrase backup challenge
 */

/**
 * @typedef {Object} OnboardingOptions
 * @property {InitState} initState The initial controller state
 */

/**
 * Controller responsible for maintaining
 * a cache of account balances in local storage
 */
class OnboardingController {
  /**
   * Creates a new controller instance
   *
   * @param {OnboardingOptions} [opts] Controller configuration parameters
   */
  constructor (opts = {}) {
    const initState = extend(clone(defaultState), opts.initState)
    this.store = new ObservableStore(initState)
  }

  setSeedPhraseBackedUp (newSeedPhraseBackUpState) {
    this.store.updateState({
      seedPhraseBackedUp: newSeedPhraseBackUpState,
    })
  }

  getSeedPhraseBackedUp () {
    return this.store.getState().seedPhraseBackedUp
  }

  /**
   * Reset the controller with default state
   * @returns {Promise<void>} Promise resolves with undefined
   */
  async reset () {
    this.store.putState(clone(defaultState))
  }
}

module.exports = OnboardingController
