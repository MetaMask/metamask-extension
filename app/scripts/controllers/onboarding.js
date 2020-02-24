<<<<<<< HEAD
const ObservableStore = require('obs-store')
const extend = require('xtend')
=======
import ObservableStore from 'obs-store'
import log from 'loglevel'
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc

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
<<<<<<< HEAD
    const initState = extend({
      seedPhraseBackedUp: true,
    }, opts.initState)
=======
    const initialTransientState = {
      onboardingTabs: {},
    }
    const initState = Object.assign(
      {
        seedPhraseBackedUp: true,
      },
      opts.initState,
      initialTransientState,
    )
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
    this.store = new ObservableStore(initState)
  }

  setSeedPhraseBackedUp (newSeedPhraseBackUpState) {
    this.store.updateState({
      seedPhraseBackedUp: newSeedPhraseBackUpState,
    })
  }

<<<<<<< HEAD
  getSeedPhraseBackedUp () {
    return this.store.getState().seedPhraseBackedUp
  }

=======
  /**
   * Registering a site as having initiated onboarding
   *
   * @param {string} location - The location of the site registering
   * @param {string} tabId - The id of the tab registering
   */
  registerOnboarding = async (location, tabId) => {
    if (this.completedOnboarding) {
      log.debug('Ignoring registerOnboarding; user already onboarded')
      return
    }
    const onboardingTabs = Object.assign({}, this.store.getState().onboardingTabs)
    if (!onboardingTabs[location] || onboardingTabs[location] !== tabId) {
      log.debug(`Registering onboarding tab at location '${location}' with tabId '${tabId}'`)
      onboardingTabs[location] = tabId
      this.store.updateState({ onboardingTabs })
    }
  }
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
}

export default OnboardingController
