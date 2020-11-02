import ObservableStore from 'obs-store'
import log from 'loglevel'

/**
 * @typedef {Object} InitState
 * @property {Boolean} seedPhraseBackedUp Indicates whether the user has completed the seed phrase backup challenge
 */

/**
 * @typedef {Object} OnboardingOptions
 * @property {InitState} initState The initial controller state
 * @property {PreferencesController} preferencesController Controller for managing user perferences
 */

/**
 * Controller responsible for maintaining
 * state related to onboarding
 */
export default class OnboardingController {
  /**
   * Creates a new controller instance
   *
   * @param {OnboardingOptions} [opts] Controller configuration parameters
   */
  constructor(opts = {}) {
    const initialTransientState = {
      onboardingTabs: {},
    }
    const initState = {
      seedPhraseBackedUp: true,
      ...opts.initState,
      ...initialTransientState,
    }
    this.store = new ObservableStore(initState)
    this.preferencesController = opts.preferencesController
    this.completedOnboarding = this.preferencesController.store.getState().completedOnboarding

    this.preferencesController.store.subscribe(({ completedOnboarding }) => {
      if (completedOnboarding !== this.completedOnboarding) {
        this.completedOnboarding = completedOnboarding
        if (completedOnboarding) {
          this.store.updateState(initialTransientState)
        }
      }
    })
  }

  setSeedPhraseBackedUp(newSeedPhraseBackUpState) {
    this.store.updateState({
      seedPhraseBackedUp: newSeedPhraseBackUpState,
    })
  }

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
    const onboardingTabs = { ...this.store.getState().onboardingTabs }
    if (!onboardingTabs[location] || onboardingTabs[location] !== tabId) {
      log.debug(
        `Registering onboarding tab at location '${location}' with tabId '${tabId}'`,
      )
      onboardingTabs[location] = tabId
      this.store.updateState({ onboardingTabs })
    }
  }
}
