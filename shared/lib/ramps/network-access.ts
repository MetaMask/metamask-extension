/**
 * The single definition of the ramps network-access policy, shared by the
 * background controller gate and the UI so the two cannot drift.
 *
 * Basic functionality (`useExternalServices`) is the user's privacy switch for
 * external services, and onboarding completion marks the point where ramps
 * state exists. Only these two signals decide whether ramps may reach the
 * network; callers with additional requirements (e.g. order syncing also needs
 * backup-and-sync) layer those on top.
 */
export type RampsNetworkAccessState = {
  completedOnboarding?: boolean;
  useExternalServices?: boolean;
};

/**
 * Determines whether ramps may reach the network.
 *
 * @param state - The onboarding and basic functionality state.
 * @param state.completedOnboarding - Whether onboarding is complete.
 * @param state.useExternalServices - Whether basic functionality is enabled.
 * @returns Whether ramps network access is allowed.
 */
export function isRampsNetworkAllowed({
  completedOnboarding,
  useExternalServices,
}: RampsNetworkAccessState): boolean {
  return Boolean(completedOnboarding && useExternalServices);
}
