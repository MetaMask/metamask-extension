const ObservableStore = require('obs-store')
const extend = require('xtend')
const log = require('loglevel')

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
class OnboardingController {
  /**
   * Creates a new controller instance
   *
   * @param {OnboardingOptions} [opts] Controller configuration parameters
   */
  constructor (opts = {}) {
    const initialTransientState = {
      initiatedOnboarding: [],
      onboardingTabs: {},
    }
    const initState = extend(
      {
        seedPhraseBackedUp: true,
      },
      opts.initState,
      initialTransientState,
    )
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

  setSeedPhraseBackedUp (newSeedPhraseBackUpState) {
    this.store.updateState({
      seedPhraseBackedUp: newSeedPhraseBackUpState,
    })
  }

  getSeedPhraseBackedUp () {
    return this.store.getState().seedPhraseBackedUp
  }

  /**
   * Registering a site as having an onboarding button
   *
   * @param {string} location - The location of the site registering
   * @param {string} tabId - The id of the tab registering
   */
  async registerOnboarding (location, tabId) {
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

  /**
   * Registering a site as having an onboarding button
   *
   * @param {string} openerLocation - The location of site that opened the onboarding forwarder
   */
  async registerOnboardingForwarder (openerLocation) {
    if (this.completedOnboarding) {
      log.debug('Ignoring registerOnboardingForwarder; user already onboarded')
      return
    }
    const initiatedOnboarding = this.store.getState().initiatedOnboarding.slice()
    if (!initiatedOnboarding.includes(openerLocation)) {
      log.debug(`Registering forwarder opener location: '${openerLocation}'`)
      initiatedOnboarding.push(openerLocation)
      this.store.updateState({ initiatedOnboarding })
    }
  }

}

module.exports = OnboardingController
