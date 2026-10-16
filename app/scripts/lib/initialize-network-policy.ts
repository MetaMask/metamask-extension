import {
  getDefaultNetworkControllerState,
  RpcEndpointType,
  type NetworkState,
  type NetworkControllerStateChangeEvent,
} from '@metamask/network-controller';
import type { SeedlessOnboardingControllerState } from '@metamask/seedless-onboarding-controller';
import { FirstTimeFlowType } from '../../../shared/constants/onboarding';
import {
  isNetworkRequestAllowed,
  normalizeNetworkPolicy,
  type NetworkPolicy,
} from '../../../shared/lib/network-policy';
import type { Preferences } from '../../../shared/types/preferences';
import type {
  OnboardingControllerState,
  OnboardingControllerStateChangeEvent,
} from '../controllers/onboarding';
import type {
  PreferencesControllerState,
  PreferencesControllerStateChangeEvent,
} from '../controllers/preferences-controller';
import type {
  NetworkPolicyControllerState,
  NetworkPolicyControllerStateChangeEvent,
} from '../controllers/network-policy/network-policy-controller.types';
import type { RootMessenger } from './messenger';

export type NetworkPolicyState = Partial<
  Record<
    'OnboardingController',
    Partial<
      Pick<
        OnboardingControllerState,
        'completedOnboarding' | 'firstTimeFlowType'
      >
    >
  > &
    Record<
      'PreferencesController',
      Partial<Pick<PreferencesControllerState, 'useExternalServices'>> & {
        preferences?: Partial<Pick<Preferences, 'hasLinkedSocialLoginProfile'>>;
      }
    > &
    Record<
      'NetworkController',
      Partial<Pick<NetworkState, 'networkConfigurationsByChainId'>>
    > &
    Record<
      'SeedlessOnboardingController',
      Partial<Pick<SeedlessOnboardingControllerState, 'authConnection'>>
    > &
    Record<'NetworkPolicyController', Partial<NetworkPolicyControllerState>>
>;

type NetworkPolicyEvents =
  | OnboardingControllerStateChangeEvent
  | PreferencesControllerStateChangeEvent
  | NetworkControllerStateChangeEvent
  | NetworkPolicyControllerStateChangeEvent;

type NetworkPolicyMessenger = Pick<
  RootMessenger<never, NetworkPolicyEvents>,
  'subscribe'
>;

/**
 * Derives the base network policy from the controller state restored at startup.
 * Onboarding exceptions are transient grants owned by the background authority;
 * a persisted flow selection never restores a grant after a restart.
 *
 * @param options - The state and build configuration.
 * @param options.state - Current or persisted controller state.
 * @param options.infuraProjectId - Project ID used by NetworkController.
 * @returns The policy enforced for ordinary extension requests.
 */
export function deriveNetworkPolicy({
  state,
  infuraProjectId,
}: {
  state: NetworkPolicyState;
  infuraProjectId?: string;
}): NetworkPolicy {
  if (state.OnboardingController?.completedOnboarding !== true) {
    return {
      mode: 'blocked',
      allowedDomains: [],
      allowedRpcUrls: [],
    };
  }

  const persistedPolicy = state.NetworkPolicyController;
  if (
    persistedPolicy !== undefined &&
    (persistedPolicy === null ||
      typeof persistedPolicy !== 'object' ||
      Array.isArray(persistedPolicy))
  ) {
    throw new TypeError('Invalid network policy controller state');
  }

  const flow = state.OnboardingController.firstTimeFlowType;
  // A linked social profile does not change an SRP wallet's privacy policy.
  // Authentication can precede wallet creation. Require completed social
  // onboarding history rather than inferring wallet type from residual tokens.
  const isSeedless =
    flow === FirstTimeFlowType.socialCreate ||
    flow === FirstTimeFlowType.socialImport;
  if (
    state.PreferencesController?.useExternalServices !== false ||
    isSeedless
  ) {
    const persistedDomains = persistedPolicy?.postOnboardingNetworkDomains;
    // Only missing state gets the default. Malformed persisted values must
    // fail validation before startup can publish a broader browser grant.
    const configuredDomains =
      persistedDomains === undefined ? '*' : persistedDomains;
    return normalizeNetworkPolicy({
      mode: configuredDomains === '*' ? 'allow-all' : 'allowlist',
      allowedDomains: configuredDomains === '*' ? [] : configuredDomains,
      allowedRpcUrls: [],
    });
  }

  const networks =
    state.NetworkController?.networkConfigurationsByChainId ??
    getDefaultNetworkControllerState().networkConfigurationsByChainId;
  const allowedRpcUrls = Object.values(networks).flatMap(({ rpcEndpoints }) =>
    rpcEndpoints.flatMap((endpoint) => {
      const primaryUrl =
        endpoint.type === RpcEndpointType.Infura
          ? infuraProjectId &&
            endpoint.url.replace('{infuraProjectId}', infuraProjectId)
          : endpoint.url;
      // Only saved endpoints are authorized. Build-time QuickNode overrides
      // must never silently expand the user's allowlist in privacy mode.
      return [primaryUrl, ...(endpoint.failoverUrls ?? [])].flatMap((url) => {
        if (!url) {
          return [];
        }
        try {
          return normalizeNetworkPolicy({
            mode: 'allowlist',
            allowedDomains: [],
            allowedRpcUrls: [url],
          }).allowedRpcUrls;
        } catch {
          // A malformed saved endpoint contributes no permission.
          return [];
        }
      });
    }),
  );

  return normalizeNetworkPolicy({
    mode: 'allowlist',
    allowedDomains: [],
    allowedRpcUrls,
  });
}

/**
 * Keep only destinations authorized both before and after a pending mutation.
 * @param current
 * @param next
 */
function intersectNetworkPolicies(
  current: NetworkPolicy,
  next: NetworkPolicy,
): NetworkPolicy {
  if (current.mode === 'blocked' || next.mode === 'blocked') {
    return { mode: 'blocked', allowedDomains: [], allowedRpcUrls: [] };
  }
  if (current.mode === 'allow-all') {
    return next;
  }
  if (next.mode === 'allow-all') {
    return current;
  }
  return normalizeNetworkPolicy({
    mode: 'allowlist',
    allowedDomains: current.allowedDomains.filter((domain) =>
      next.allowedDomains.includes(domain),
    ),
    allowedRpcUrls: [
      ...current.allowedRpcUrls.filter((url) =>
        isNetworkRequestAllowed(next, url),
      ),
      ...next.allowedRpcUrls.filter((url) =>
        isNetworkRequestAllowed(current, url),
      ),
    ],
  });
}

/**
 * Subscribes before controller construction so every relevant state change
 * reaches the private background authority. Public mutation APIs use
 * `runWithPolicy` before restrictive changes and await browser enforcement
 * before acknowledging the change to the UI.
 *
 * @param options - Initialization options.
 * @param options.messenger - The root controller messenger.
 * @param options.state - State already enforced before controller construction.
 * @param options.infuraProjectId - Project ID used by NetworkController.
 * @param options.updateNetworkPolicy - The private policy authority.
 * @param options.onError - Reports asynchronous subscription failures.
 * @returns Methods for coordinated mutations and cleanup.
 */
export function initializeNetworkPolicy({
  messenger,
  state,
  infuraProjectId,
  updateNetworkPolicy,
  onError,
}: {
  messenger: NetworkPolicyMessenger;
  state: NetworkPolicyState;
  infuraProjectId?: string;
  updateNetworkPolicy: (policy: NetworkPolicy) => Promise<void>;
  onError: (error: unknown) => void;
}) {
  let currentState = { ...state };
  let pending = Promise.resolve();
  let coordinatedChange = false;
  let mutationQueue = Promise.resolve();

  const enforce = (policy: NetworkPolicy): Promise<void> => {
    pending = updateNetworkPolicy(policy);
    // Messenger publication is synchronous. Retain the rejection for callers
    // waiting for enforcement, and attach a handler for background-only events.
    pending.catch(onError);
    return pending;
  };
  const apply = (nextState: NetworkPolicyState): Promise<void> =>
    enforce(deriveNetworkPolicy({ state: nextState, infuraProjectId }));
  const update = (change: NetworkPolicyState) => {
    currentState = { ...currentState, ...change };
    if (!coordinatedChange) {
      apply(currentState);
    }
  };
  const onOnboarding = (next: OnboardingControllerState) => {
    if (
      next.completedOnboarding !==
        currentState.OnboardingController?.completedOnboarding ||
      next.firstTimeFlowType !==
        currentState.OnboardingController?.firstTimeFlowType
    ) {
      update({ OnboardingController: next });
    }
  };
  const onPreferences = (next: PreferencesControllerState) => {
    if (
      next.useExternalServices !==
      currentState.PreferencesController?.useExternalServices
    ) {
      update({ PreferencesController: next });
    }
  };
  const onNetworks = (next: NetworkState) => {
    if (
      next.networkConfigurationsByChainId !==
      currentState.NetworkController?.networkConfigurationsByChainId
    ) {
      update({ NetworkController: next });
    }
  };
  const onConfiguration = (next: NetworkPolicyControllerState) => {
    if (
      next.postOnboardingNetworkDomains !==
      currentState.NetworkPolicyController?.postOnboardingNetworkDomains
    ) {
      update({ NetworkPolicyController: next });
    }
  };
  messenger.subscribe('OnboardingController:stateChange', onOnboarding);
  messenger.subscribe('PreferencesController:stateChange', onPreferences);
  messenger.subscribe('NetworkController:stateChange', onNetworks);
  messenger.subscribe('NetworkPolicyController:stateChange', onConfiguration);

  return {
    /**
     * Apply prospective restrictions before mutating controllers. Intermediate
     * state changes remain private until the coordinated mutation completes.
     * This prevents resetWallet's temporary default preferences from opening
     * the network gate while its onboarding state is still being cleared.
     * @param operation
     * @param changes
     */
    runWithPolicy<Result>(
      operation: () => Result | Promise<Result>,
      changes?: NetworkPolicyState | (() => NetworkPolicyState),
    ): Promise<Result> {
      const run = async () => {
        try {
          if (changes) {
            coordinatedChange = true;
            const prospective =
              typeof changes === 'function' ? changes() : changes;
            const nextState = {
              ...currentState,
              ...prospective,
              OnboardingController: {
                ...currentState.OnboardingController,
                ...prospective.OnboardingController,
              },
              PreferencesController: {
                ...currentState.PreferencesController,
                ...prospective.PreferencesController,
              },
            };
            // Remove access before the mutation, but grant new destinations only
            // after it succeeds. Rejected saves must never publish a new grant.
            await enforce(
              intersectNetworkPolicies(
                deriveNetworkPolicy({ state: currentState, infuraProjectId }),
                deriveNetworkPolicy({ state: nextState, infuraProjectId }),
              ),
            );
          }
          const result = await operation();
          if (coordinatedChange) {
            coordinatedChange = false;
            await apply(currentState);
          } else {
            await pending;
          }
          return result;
        } catch (error) {
          coordinatedChange = false;
          // Restore only the real controller state. Never leave a prospective
          // grant in place after its underlying state mutation fails.
          await apply(currentState);
          throw error;
        }
      };
      const result = mutationQueue.then(run);
      mutationQueue = result.then(
        () => undefined,
        () => undefined,
      );
      return result;
    },
  };
}
