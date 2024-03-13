import { ObservableStore } from '@metamask/obs-store';
import log from 'loglevel';

type flowTypes = 'create' | 'import';
/**
 * The state of the OnboardingController
 */
export type OnboardingControllerState = {
  seedPhraseBackedUp: boolean;
  firstTimeFlowType: flowTypes | null;
  completedOnboarding: boolean;
  onboardingTabs: Record<string, string>;
};

const defaultTransientState: Record<string, Record<string, string>> = {
  onboardingTabs: {},
};

const defaultState: OnboardingControllerState = {
  seedPhraseBackedUp: false,
  firstTimeFlowType: null,
  completedOnboarding: false,
  onboardingTabs: {},
};

/**
 * Controller responsible for maintaining
 * state related to onboarding
 */
export default class OnboardingController {
  /**
   * Observable store containing controller data.
   */
  store: ObservableStore<OnboardingControllerState>;

  /**
   * Constructs a Onboarding  controller.
   *
   * @param options - the controller options
   * @param options.state - Initial controller state.
   */
  constructor({ state }: { state: OnboardingControllerState }) {
    this.store = new ObservableStore({
      ...defaultState,
      ...state,
      ...defaultTransientState,
    });
  }

  /**
   * Setter for the `seedPhraseBackedUp` property
   *
   * @param newSeedPhraseBackUpState - Indicates if the seedphrase is backup by the user or not
   */
  setSeedPhraseBackedUp(newSeedPhraseBackUpState: boolean) {
    this.store.updateState({
      seedPhraseBackedUp: newSeedPhraseBackUpState,
    });
  }

  /**
   * Sets the completedOnboarding state to true, indicating that the user has completed the
   * onboarding process.
   */
  async completeOnboarding(): Promise<boolean> {
    this.store.updateState({
      completedOnboarding: true,
    });
    return true;
  }

  /**
   * Setter for the `firstTimeFlowType` property
   *
   * @param type - Indicates the type of first time flow - create or import - the user wishes to follow
   */
  setFirstTimeFlowType(type: flowTypes) {
    this.store.updateState({ firstTimeFlowType: type });
  }

  /**
   * Registering a site as having initiated onboarding
   *
   * @param location - The location of the site registering
   * @param tabId - The id of the tab registering
   */
  registerOnboarding = async (location: string, tabId: string) => {
    if (this.store.getState().completedOnboarding) {
      log.debug('Ignoring registerOnboarding; user already onboarded');
      return;
    }
    const onboardingTabs = { ...this.store.getState().onboardingTabs };
    if (!onboardingTabs[location] || onboardingTabs[location] !== tabId) {
      log.debug(
        `Registering onboarding tab at location '${location}' with tabId '${tabId}'`,
      );
      onboardingTabs[location] = tabId;
      this.store.updateState({ onboardingTabs });
    }
  };
}
