import { NetworkPolicyController } from '../controllers/network-policy/network-policy-controller';
import type { NetworkPolicyControllerMessenger } from '../controllers/network-policy/network-policy-controller.types';
import type { MessengerClientInitFunction } from './types';

/**
 * Restore post-onboarding authorization and expose the trusted UI action.
 *
 * @param request - The initialization request.
 * @param request.controllerMessenger - The policy controller messenger.
 * @param request.persistedState - Persisted controller state.
 * @param request.applyNetworkPolicyDomains - Private browser policy coordination.
 * @returns The initialized policy controller.
 */
export const NetworkPolicyControllerInit: MessengerClientInitFunction<
  NetworkPolicyController,
  NetworkPolicyControllerMessenger
> = ({ controllerMessenger, persistedState, applyNetworkPolicyDomains }) => {
  const messengerClient = new NetworkPolicyController({
    messenger: controllerMessenger,
    state: persistedState.NetworkPolicyController,
    applyDomainPolicy: applyNetworkPolicyDomains,
  });
  return {
    messengerClient,
    api: {
      configurePostOnboardingNetworkDomains:
        messengerClient.configurePostOnboardingDomains.bind(messengerClient),
    },
  };
};
