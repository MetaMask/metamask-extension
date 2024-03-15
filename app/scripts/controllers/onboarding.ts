import { ObservableStore } from '@metamask/obs-store';
import log from 'loglevel';

type firstTimeFlowTypes = 'create' | 'import';
/**
 * The state of the OnboardingController
 */
export type OnboardingControllerState = {
  seedPhraseBackedUp: boolean | null;
  firstTimeFlowType: firstTimeFlowTypes | null;
  completedOnboarding: boolean;
  onboardingTabs?: Record<string, string>;
};

const defaultTransientState = {
  onboardingTabs: {},
} satisfies Pick<OnboardingControllerState, 'onboardingTabs'>;

const defaultState = {
  seedPhraseBackedUp: null,
  firstTimeFlowType: null,
  completedOnboarding: false,
} satisfies OnboardingControllerState;

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
  setSeedPhraseBackedUp(newSeedPhraseBackUpState: boolean): void {
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
  setFirstTimeFlowType(type: firstTimeFlowTypes): void {
    this.store.updateState({ firstTimeFlowType: type });
  }

  /**
   * Registering a site as having initiated onboarding
   *
   * @param location - The location of the site registering
   * @param tabId - The id of the tab registering
   */
  registerOnboarding = async (
    location: string,
    tabId: string,
  ): Promise<void> => {
    if (this.store.getState().completedOnboarding) {
      log.debug('Ignoring registerOnboarding; user already onboarded');
      return;
    }
    const { onboardingTabs } = { ...(this.store.getState() ?? {}) };

    if (!onboardingTabs) {
      return;
    }

    if (!onboardingTabs[location] || onboardingTabs[location] !== tabId) {
      log.debug(
        `Registering onboarding tab at location '${location}' with tabId '${tabId}'`,
      );
      onboardingTabs[location] = tabId;
      this.store.updateState({ onboardingTabs });
    }
  };
}
