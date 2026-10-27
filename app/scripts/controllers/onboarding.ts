import {
  BaseController,
  ControllerGetStateAction,
  ControllerStateChangeEvent,
  StateMetadata,
} from '@metamask/base-controller';
import type { Messenger } from '@metamask/messenger';
import log from 'loglevel';
import { FirstTimeFlowType } from '../../../shared/constants/onboarding';
import { getIsSeedlessOnboardingFeatureEnabled } from '../../../shared/lib/environment';
import { TraceName, TraceOperation } from '../../../shared/lib/trace';
import type {
  OnboardingJourneyTraceEndRequest,
  OnboardingJourneyTraceRequest,
} from '../../../shared/types/onboarding';
import type ExtensionPlatform from '../platforms/extension';
import type {
  SentryTracingServiceBufferedEndTraceAction,
  SentryTracingServiceBufferedTraceAction,
} from '../services/sentry/sentry-tracing-service-method-action-types';
import { OnboardingControllerMethodActions } from './onboarding-method-action-types';

// Unique name for the controller
const controllerName = 'OnboardingController';

/**
 * The state of the {@link OnboardingController}
 */
export type OnboardingControllerState = {
  seedPhraseBackedUp: boolean | null;
  firstTimeFlowType: FirstTimeFlowType | null;
  completedOnboarding: boolean;
  hasSeenOnboardingCompletionPage: boolean;
  /**
   * True after a journey ends successfully. Later mounts must not open another
   * trace for the same profile.
   */
  onboardingJourneyEnded: boolean;
  onboardingTabs?: Record<string, string>;
};

/**
 * Function to get default state of the {@link OnboardingController}.
 */
export const getDefaultOnboardingControllerState = () => ({
  seedPhraseBackedUp: null,
  firstTimeFlowType: null,
  completedOnboarding: false,
  hasSeenOnboardingCompletionPage: false,
  onboardingJourneyEnded: false,
});

const defaultTransientState = {
  onboardingTabs: {},
} satisfies Pick<OnboardingControllerState, 'onboardingTabs'>;

type OnboardingJourney = {
  lastStep: string;
  traceId: string;
};

/**
 * {@link OnboardingController}'s metadata.
 *
 * This allows us to choose if fields of the state should be persisted or not
 * using the `persist` flag; and if they can be sent to Sentry or not, using
 * the `anonymous` flag.
 */
const controllerMetadata: StateMetadata<OnboardingControllerState> = {
  seedPhraseBackedUp: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: true,
    usedInUi: true,
  },
  firstTimeFlowType: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: true,
    usedInUi: true,
  },
  completedOnboarding: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: true,
    usedInUi: true,
  },
  hasSeenOnboardingCompletionPage: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: true,
    usedInUi: true,
  },
  onboardingJourneyEnded: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: true,
    usedInUi: false,
  },
  onboardingTabs: {
    includeInStateLogs: true,
    persist: false,
    includeInDebugSnapshot: false,
    usedInUi: true,
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
export type OnboardingControllerActions =
  | OnboardingControllerGetStateAction
  | OnboardingControllerMethodActions;

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
export type AllowedActions =
  | SentryTracingServiceBufferedTraceAction
  | SentryTracingServiceBufferedEndTraceAction;

/**
 * Events that this controller is allowed to subscribe.
 */
export type AllowedEvents = never;

/**
 * Messenger type for the {@link OnboardingController}.
 */
export type OnboardingControllerMessenger = Messenger<
  typeof controllerName,
  OnboardingControllerActions | AllowedActions,
  OnboardingControllerControllerEvents | AllowedEvents
>;

const MESSENGER_EXPOSED_METHODS = [
  'setSeedPhraseBackedUp',
  'completeOnboarding',
  'setHasSeenOnboardingCompletionPage',
  'setFirstTimeFlowType',
  'registerOnboarding',
  'getIsSocialLoginFlow',
  'resetOnboarding',
  'startOnboardingJourney',
  'updateOnboardingJourney',
  'endOnboardingJourney',
] as const;

/**
 * Controller responsible for maintaining
 * state related to onboarding
 */
export class OnboardingController extends BaseController<
  typeof controllerName,
  OnboardingControllerState,
  OnboardingControllerMessenger
> {
  readonly #platform: ExtensionPlatform;

  readonly #onboardingJourneysByTabId = new Map<
    string | undefined,
    OnboardingJourney
  >();

  readonly #handleTabRemoved = (tabId: number): void => {
    const normalizedTabId = String(tabId);
    const journey = this.#onboardingJourneysByTabId.get(normalizedTabId);
    if (!journey) {
      return;
    }

    this.endOnboardingJourney({
      tabId: normalizedTabId,
      lastStep: journey.lastStep,
      success: false,
      abandoned: true,
    });
  };

  /**
   * Constructs a Onboarding  controller.
   *
   * @param options - the controller options
   * @param options.messenger - Messenger used to communicate with BaseV2 controller.
   * @param options.state - Initial controller state.
   * @param options.platform - Extension platform used to observe tab removal.
   */
  constructor({
    messenger,
    state,
    platform,
  }: {
    messenger: OnboardingControllerMessenger;
    state:
      | Partial<Omit<OnboardingControllerState, 'onboardingTabs'>>
      | undefined;
    platform: ExtensionPlatform;
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

    this.#platform = platform;
    this.messenger.registerMethodActionHandlers(
      this,
      MESSENGER_EXPOSED_METHODS,
    );
    this.#platform.addTabRemovedListener?.(this.#handleTabRemoved);
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
   * Records that the user has been shown the onboarding completion page at least once.
   *
   * @param hasSeenOnboardingCompletionPage - Whether the onboarding completion page has been shown.
   */
  setHasSeenOnboardingCompletionPage(
    hasSeenOnboardingCompletionPage: boolean,
  ): void {
    this.update((state) => {
      state.hasSeenOnboardingCompletionPage = hasSeenOnboardingCompletionPage;
    });
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
  async registerOnboarding(location: string, tabId: string): Promise<void> {
    if (this.state.completedOnboarding) {
      log.debug('Ignoring registerOnboarding; user already onboarded');
      return;
    }
    const { onboardingTabs } = { ...this.state };

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
  }

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

  /**
   * Start or resume the onboarding journey associated with a browser tab.
   *
   * A tab with a live journey is resumed. A new journey is not opened after
   * this profile has finished onboarding or already ended a journey
   * successfully.
   *
   * @param request - The onboarding tab and current step.
   * @returns The opaque ID used to parent child traces, or undefined when no
   * journey should be opened.
   */
  startOnboardingJourney(
    request: OnboardingJourneyTraceRequest,
  ): string | undefined {
    const currentJourney = this.#onboardingJourneysByTabId.get(request.tabId);

    if (currentJourney) {
      currentJourney.lastStep = request.lastStep;
      return currentJourney.traceId;
    }

    if (this.state.completedOnboarding || this.state.onboardingJourneyEnded) {
      return undefined;
    }

    const traceId = crypto.randomUUID();
    this.#onboardingJourneysByTabId.set(request.tabId, {
      lastStep: request.lastStep,
      traceId,
    });

    this.messenger.call('SentryTracingService:bufferedTrace', {
      name: TraceName.OnboardingJourneyOverall,
      id: traceId,
      op: TraceOperation.OnboardingUserJourney,
      data: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        perf_fix: 'trace-registry-v1',
      },
    });

    return traceId;
  }

  /**
   * Update the last known onboarding step for a browser tab.
   *
   * @param request - The onboarding tab and current step.
   */
  updateOnboardingJourney(request: OnboardingJourneyTraceRequest): void {
    const currentJourney = this.#onboardingJourneysByTabId.get(request.tabId);

    if (!currentJourney) {
      return;
    }

    currentJourney.lastStep = request.lastStep;
  }

  /**
   * End the onboarding journey associated with a browser tab.
   *
   * @param request - The onboarding tab, result, and last step.
   */
  endOnboardingJourney(request: OnboardingJourneyTraceEndRequest): void {
    const currentJourney = this.#onboardingJourneysByTabId.get(request.tabId);

    if (!currentJourney) {
      return;
    }

    this.#onboardingJourneysByTabId.delete(request.tabId);
    this.messenger.call('SentryTracingService:bufferedEndTrace', {
      name: TraceName.OnboardingJourneyOverall,
      id: currentJourney.traceId,
      data: {
        success: request.success,
        ...(request.abandoned ? { abandoned: true } : {}),
        // eslint-disable-next-line @typescript-eslint/naming-convention
        last_step: request.lastStep,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        perf_fix: 'trace-registry-v1',
      },
    });

    if (request.success) {
      this.update((state) => {
        state.onboardingJourneyEnded = true;
      });
    }
  }

  /**
   * Reset the onboarding controller state.
   */
  resetOnboarding(): void {
    // Drop in-progress journeys so the next attempt starts a new trace.
    // Clearing onboardingJourneyEnded alone would resume the tab's old journey.
    for (const [tabId, journey] of this.#onboardingJourneysByTabId) {
      this.endOnboardingJourney({
        ...(tabId === undefined ? {} : { tabId }),
        lastStep: journey.lastStep,
        success: false,
        abandoned: true,
      });
    }

    this.update((state) => {
      state.completedOnboarding = false;
      state.hasSeenOnboardingCompletionPage = false;
      state.onboardingJourneyEnded = false;
      state.firstTimeFlowType = null;
      state.seedPhraseBackedUp = null;
      state.onboardingTabs = {};
    });
  }
}
