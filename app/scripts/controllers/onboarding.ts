import {
  BaseController,
  ControllerGetStateAction,
  ControllerStateChangeEvent,
  RestrictedMessenger,
} from '@metamask/base-controller';
import log from 'loglevel';
import { FirstTimeFlowType } from '../../../shared/constants/onboarding';
import { getIsSeedlessOnboardingFeatureEnabled } from '../../../shared/modules/environment';

// Unique name for the controller
const controllerName = 'OnboardingController';

/**
 * The state of the {@link OnboardingController}
 */
export type OnboardingControllerState = {
  seedPhraseBackedUp: boolean | null;
  firstTimeFlowType: FirstTimeFlowType | null;
  completedOnboarding: boolean;
  onboardingTabs?: Record<string, string>;
};

/**
 * Function to get default state of the {@link OnboardingController}.
 */
export const getDefaultOnboardingControllerState = () => ({
  seedPhraseBackedUp: null,
  firstTimeFlowType: null,
  completedOnboarding: false,
});

const defaultTransientState = {
  onboardingTabs: {},
} satisfies Pick<OnboardingControllerState, 'onboardingTabs'>;

/**
 * {@link OnboardingController}'s metadata.
 *
 * This allows us to choose if fields of the state should be persisted or not
 * using the `persist` flag; and if they can be sent to Sentry or not, using
 * the `anonymous` flag.
 */
const controllerMetadata = {
  seedPhraseBackedUp: {
    persist: true,
    anonymous: true,
  },
  firstTimeFlowType: {
    persist: true,
    anonymous: true,
  },
  completedOnboarding: {
    persist: true,
    anonymous: true,
  },
  onboardingTabs: {
    persist: false,
    anonymous: false,
  },
};

/**
 * Returns the state of the {@link OnboardingController}.
 */
export type OnboardingControllerGetStateAction = ControllerGetStateAction<
  typeof controllerName,
  OnboardingControllerState
>;

/**
 * Actions exposed by the {@link OnboardingController}.
 */
export type OnboardingControllerActions = OnboardingControllerGetStateAction;

/**
 * Event emitted when the state of the {@link OnboardingController} changes.
 */
export type OnboardingControllerStateChangeEvent = ControllerStateChangeEvent<
  typeof controllerName,
  OnboardingControllerState
>;

/**
 * Events emitted by {@link OnboardingController}.
 */
export type OnboardingControllerControllerEvents =
  OnboardingControllerStateChangeEvent;

/**
 * Actions that this controller is allowed to call.
 */
export type AllowedActions = never;

/**
 * Events that this controller is allowed to subscribe.
 */
export type AllowedEvents = never;

/**
 * Messenger type for the {@link OnboardingController}.
 */
export type OnboardingControllerMessenger = RestrictedMessenger<
  typeof controllerName,
  OnboardingControllerActions | AllowedActions,
  OnboardingControllerControllerEvents | AllowedEvents,
  AllowedActions['type'],
  AllowedEvents['type']
>;

/**
 * Controller responsible for maintaining
 * state related to onboarding
 */
export default class OnboardingController extends BaseController<
  typeof controllerName,
  OnboardingControllerState,
  OnboardingControllerMessenger
> {
  /**
   * Constructs a Onboarding  controller.
   *
   * @param options - the controller options
   * @param options.messenger - Messenger used to communicate with BaseV2 controller.
   * @param options.state - Initial controller state.
   */
  constructor({
    messenger,
    state,
  }: {
    messenger: OnboardingControllerMessenger;
    state: Partial<Omit<OnboardingControllerState, 'onboardingTabs'>>;
  }) {
    super({
      messenger,
      metadata: controllerMetadata,
      name: controllerName,
      state: {
        ...getDefaultOnboardingControllerState(),
        ...state,
        ...defaultTransientState,
      },
    });
  }

  /**
   * Setter for the `seedPhraseBackedUp` property
   *
   * @param newSeedPhraseBackUpState - Indicates if the seedphrase is backup by the user or not
   */
  setSeedPhraseBackedUp(newSeedPhraseBackUpState: boolean): void {
    this.update((state) => {
      state.seedPhraseBackedUp = newSeedPhraseBackUpState;
    });
  }

  /**
   * Sets the completedOnboarding state to true, indicating that the user has completed the
   * onboarding process.
   */
  completeOnboarding(): boolean {
    this.update((state) => {
      state.completedOnboarding = true;
    });
    return true;
  }

  /**
   * Setter for the `firstTimeFlowType` property
   *
   * @param type - Indicates the type of first time flow - create or import - the user wishes to follow
   */
  setFirstTimeFlowType(type: FirstTimeFlowType): void {
    this.update((state) => {
      state.firstTimeFlowType = type;
    });
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
    if (this.state.completedOnboarding) {
      log.debug('Ignoring registerOnboarding; user already onboarded');
      return;
    }
    const { onboardingTabs } = { ...(this.state ?? {}) };

    if (!onboardingTabs) {
      return;
    }

    if (!onboardingTabs[location] || onboardingTabs[location] !== tabId) {
      log.debug(
        `Registering onboarding tab at location '${location}' with tabId '${tabId}'`,
      );
      this.update((state) => {
        state.onboardingTabs = {
          ...onboardingTabs,
          [location]: tabId,
        };
      });
    }
  };

  /**
   * Check if the user onboarding flow is Social login flow or not.
   *
   * @returns true if the user onboarding flow is Social loing flow, otherwise false.
   */
  getIsSocialLoginFlow(): boolean {
    const isSocialLoginFeatureEnabled = getIsSeedlessOnboardingFeatureEnabled();
    if (!isSocialLoginFeatureEnabled) {
      return false;
    }

    const { firstTimeFlowType } = this.state;
    return (
      firstTimeFlowType === FirstTimeFlowType.socialCreate ||
      firstTimeFlowType === FirstTimeFlowType.socialImport
    );
  }
}
