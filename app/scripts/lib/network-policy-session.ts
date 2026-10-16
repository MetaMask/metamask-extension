import type { NetworkPolicyCoordinator } from './network-policy-coordinator';

/**
 * Give one controller initialization revocable policy authority. A failed or
 * replaced controller can retain background tasks, but those tasks must never
 * change the policy belonging to its replacement.
 *
 * @param coordinator - The root background's policy coordinator.
 * @returns Authority for one initialization and its synchronous revoker.
 */
export function createNetworkPolicySession(
  coordinator: NetworkPolicyCoordinator,
): { policy: NetworkPolicyCoordinator; revoke: () => void } {
  let active = true;
  const call = <Result>(operation: () => Promise<Result>): Promise<Result> => {
    if (!active) {
      return Promise.reject(new Error('Network policy session was revoked'));
    }
    return operation();
  };

  const policy: NetworkPolicyCoordinator = Object.freeze({
    update: (snapshot) => call(() => coordinator.update(snapshot)),
    beginSocialOnboarding: (connection) =>
      call(() => coordinator.beginSocialOnboarding(connection)),
    endSocialOnboarding: () => call(() => coordinator.endSocialOnboarding()),
    allowRpcValidation: (details) =>
      call(() => coordinator.allowRpcValidation(details)),
  });
  return {
    policy,
    revoke: () => {
      active = false;
    },
  };
}
