import type {
  ControllerGetStateAction,
  ControllerStateChangeEvent,
} from '@metamask/base-controller';
import type { Messenger } from '@metamask/messenger';
import type { NetworkPolicyController } from './network-policy-controller';

/** Persisted network access approved for completed onboarding. */
export type NetworkPolicyControllerState = {
  /** Wildcard access or exact hostnames without implicit subdomain grants. */
  postOnboardingNetworkDomains: '*' | string[];
};

/** Apply browser authorization before committing its corresponding state. */
export type NetworkPolicyDomainPolicyApplier = (
  domains: NetworkPolicyControllerState['postOnboardingNetworkDomains'],
  commit: () => void,
) => Promise<void>;

export type NetworkPolicyControllerGetStateAction = ControllerGetStateAction<
  'NetworkPolicyController',
  NetworkPolicyControllerState
>;

export type NetworkPolicyControllerConfigurePostOnboardingDomainsAction = {
  type: 'NetworkPolicyController:configurePostOnboardingDomains';
  handler: NetworkPolicyController['configurePostOnboardingDomains'];
};

export type NetworkPolicyControllerActions =
  | NetworkPolicyControllerGetStateAction
  | NetworkPolicyControllerConfigurePostOnboardingDomainsAction;

export type NetworkPolicyControllerStateChangeEvent =
  ControllerStateChangeEvent<
    'NetworkPolicyController',
    NetworkPolicyControllerState
  >;

export type NetworkPolicyControllerEvents =
  NetworkPolicyControllerStateChangeEvent;

export type NetworkPolicyControllerMessenger = Messenger<
  'NetworkPolicyController',
  NetworkPolicyControllerActions,
  NetworkPolicyControllerEvents
>;
