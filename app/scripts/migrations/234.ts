import { hasProperty, isObject } from '@metamask/utils';
import type { Migrate } from './types';

export const version = 234;

/**
 * Initialize the persisted post-onboarding domain policy for existing wallets.
 * Onboarding and SRP privacy restrictions are derived separately at runtime.
 * Preserve an existing authorization, including malformed values: controller
 * validation must reject those rather than silently broaden access.
 *
 * @param versionedData - The persisted versioned extension state.
 * @param changedControllers - Controllers whose state must be persisted.
 */
export const migrate = (async (versionedData, changedControllers) => {
  versionedData.meta.version = version;
  const { data } = versionedData;

  if (
    !hasProperty(data, 'NetworkPolicyController') ||
    data.NetworkPolicyController === undefined
  ) {
    data.NetworkPolicyController = { postOnboardingNetworkDomains: '*' };
    changedControllers.add('NetworkPolicyController');
    return;
  }

  if (
    isObject(data.NetworkPolicyController) &&
    data.NetworkPolicyController.postOnboardingNetworkDomains === undefined
  ) {
    data.NetworkPolicyController.postOnboardingNetworkDomains = '*';
    changedControllers.add('NetworkPolicyController');
  }
}) satisfies Migrate;
