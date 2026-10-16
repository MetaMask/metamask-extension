import type {
  AutoManagedNetworkClient,
  NetworkClientConfiguration,
  NetworkController,
  NetworkControllerStateChangeEvent,
} from '@metamask/network-controller';
import type {
  RemoteFeatureFlagControllerGetStateAction,
  RemoteFeatureFlagControllerState,
  RemoteFeatureFlagControllerStateChangeEvent,
} from '@metamask/remote-feature-flag-controller';
import {
  isNetworkRequestAllowed,
  normalizeNetworkPolicy,
} from '../../../shared/lib/network-policy';
import type { OnboardingControllerStateChangeEvent } from '../controllers/onboarding';
import type { PreferencesControllerStateChangeEvent } from '../controllers/preferences-controller';
import type { NetworkPolicyControllerStateChangeEvent } from '../controllers/network-policy/network-policy-controller.types';
import type { RootMessenger } from './messenger';
import {
  deriveNetworkPolicy,
  type NetworkPolicyState,
} from './initialize-network-policy';

type FailoverPolicyEvents =
  | OnboardingControllerStateChangeEvent
  | PreferencesControllerStateChangeEvent
  | NetworkControllerStateChangeEvent
  | NetworkPolicyControllerStateChangeEvent
  | RemoteFeatureFlagControllerStateChangeEvent;

/**
 * Keeps automatic RPC failover from routing privacy-mode traffic to an endpoint
 * outside the saved RPC policy. DNR remains the network boundary; disabling the
 * disallowed failover also keeps a forced rollout from replacing a usable
 * primary with a destination the browser must block.
 *
 * Register after Wallet construction so this listener follows Core's own
 * remote-feature-flag listener, which otherwise reinstates automatic failover.
 *
 * @param options - Initialized controller dependencies.
 * @param options.messenger - The background messenger.
 * @param options.networkController - The initialized network controller.
 * @param options.state - Persisted initial state.
 * @param options.infuraProjectId - Project ID used by NetworkController.
 */
export function initializeNetworkPolicyFailover({
  messenger,
  networkController,
  state,
  infuraProjectId,
}: {
  messenger: Pick<
    RootMessenger<
      RemoteFeatureFlagControllerGetStateAction,
      FailoverPolicyEvents
    >,
    'call' | 'subscribe'
  >;
  networkController: Pick<NetworkController, 'getNetworkClientRegistry'>;
  state: NetworkPolicyState;
  infuraProjectId?: string;
}): void {
  let currentState = { ...state };
  let featureFlags = messenger.call('RemoteFeatureFlagController:getState');
  const appliedModes = new WeakMap<object, string>();
  const apply = (coreChangedMode = false) => {
    const policy = deriveNetworkPolicy({
      state: currentState,
      infuraProjectId,
    });
    const configuredMode =
      featureFlags.remoteFeatureFlags.corePlatformRpcFailoverMode;
    const remoteMode =
      configuredMode === 'enabled' || configuredMode === 'forced'
        ? configuredMode
        : 'disabled';
    // Core's registry type intersects its custom and built-in index signatures;
    // individual entries are one of those client configurations at runtime.
    const clients = networkController.getNetworkClientRegistry() as Record<
      string,
      AutoManagedNetworkClient<NetworkClientConfiguration>
    >;
    for (const client of Object.values(clients)) {
      if (!client.configuration.failoverRpcUrls?.length) {
        continue;
      }
      const permitted =
        policy.mode === 'allow-all' ||
        (policy.mode === 'allowlist' &&
          (client.configuration.failoverRpcUrls ?? []).every((url) => {
            try {
              const [normalized] = normalizeNetworkPolicy({
                mode: 'allowlist',
                allowedDomains: [],
                allowedRpcUrls: [url],
              }).allowedRpcUrls;
              return isNetworkRequestAllowed(policy, normalized);
            } catch {
              return false;
            }
          }));
      const nextMode = permitted ? remoteMode : 'disabled';
      const currentMode = coreChangedMode
        ? remoteMode
        : (appliedModes.get(client) ?? remoteMode);
      if (currentMode !== nextMode) {
        client.setRpcFailoverMode(nextMode);
      }
      appliedModes.set(client, nextMode);
    }
  };

  messenger.subscribe('PreferencesController:stateChange', (next) => {
    if (
      next.useExternalServices !==
      currentState.PreferencesController?.useExternalServices
    ) {
      currentState = { ...currentState, PreferencesController: next };
      apply();
    }
  });
  messenger.subscribe('OnboardingController:stateChange', (next) => {
    if (
      next.completedOnboarding !==
        currentState.OnboardingController?.completedOnboarding ||
      next.firstTimeFlowType !==
        currentState.OnboardingController?.firstTimeFlowType
    ) {
      currentState = { ...currentState, OnboardingController: next };
      apply();
    }
  });
  messenger.subscribe('NetworkController:stateChange', (next) => {
    if (
      next.networkConfigurationsByChainId !==
      currentState.NetworkController?.networkConfigurationsByChainId
    ) {
      currentState = { ...currentState, NetworkController: next };
      apply();
    }
  });
  messenger.subscribe('NetworkPolicyController:stateChange', (next) => {
    if (
      next.postOnboardingNetworkDomains !==
      currentState.NetworkPolicyController?.postOnboardingNetworkDomains
    ) {
      currentState = { ...currentState, NetworkPolicyController: next };
      apply();
    }
  });
  messenger.subscribe(
    'RemoteFeatureFlagController:stateChange',
    (next: RemoteFeatureFlagControllerState) => {
      const coreChangedMode =
        next.remoteFeatureFlags.corePlatformRpcFailoverMode !==
        featureFlags.remoteFeatureFlags.corePlatformRpcFailoverMode;
      featureFlags = next;
      apply(coreChangedMode);
    },
  );
  apply();
}
