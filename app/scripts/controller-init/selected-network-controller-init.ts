import { SelectedNetworkController } from '@metamask/selected-network-controller';
import { WeakRefObjectMap } from '../lib/WeakRefObjectMap';
import { SelectedNetworkControllerMessenger } from './messengers';
import { ControllerInitFunction } from './types';

/**
 * Initialize the selected network controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @returns The initialized controller.
 */
export const SelectedNetworkControllerInit: ControllerInitFunction<
  SelectedNetworkController,
  SelectedNetworkControllerMessenger
> = ({ controllerMessenger, persistedState }) => {
  // Clean up stale domains from persisted state before initialization
  const cleanedState = cleanupStaleDomains(
    persistedState.SelectedNetworkController,
    controllerMessenger,
  );

  const controller = new SelectedNetworkController({
    // @ts-expect-error: `SelectedNetworkController` expects the full state, but
    // the persisted state may be partial.
    state: cleanedState,
    messenger: controllerMessenger,
    domainProxyMap: new WeakRefObjectMap(),
  });

  return {
    controller,
  };
};

/**
 * Clean up domains from SelectedNetworkController state that no longer have permissions.
 * This prevents errors when the controller tries to update network client IDs for domains
 * that don't have active permissions.
 *
 * @param state - The persisted SelectedNetworkController state.
 * @param messenger - The controller messenger.
 * @returns The cleaned state with stale domains removed.
 */
function cleanupStaleDomains(
  state: unknown,
  messenger: SelectedNetworkControllerMessenger,
): unknown {
  // If state is not an object or domains is not set, return as-is
  if (
    !state ||
    typeof state !== 'object' ||
    !('domains' in state) ||
    !state.domains ||
    typeof state.domains !== 'object'
  ) {
    return state;
  }

  try {
    // Get all subjects with permissions
    const subjectsWithPermissions = messenger.call(
      'PermissionController:getSubjectNames',
    );

    const subjectsSet = new Set(subjectsWithPermissions);

    // Filter out domains that don't have permissions
    const cleanedDomains: Record<string, string> = {};
    const domains = state.domains as Record<string, string>;

    for (const [domain, networkClientId] of Object.entries(domains)) {
      if (subjectsSet.has(domain)) {
        cleanedDomains[domain] = networkClientId;
      }
    }

    return {
      ...state,
      domains: cleanedDomains,
    };
  } catch (error) {
    // If we can't get permissions for any reason, return original state
    // This ensures we don't break initialization
    console.error(
      'Failed to cleanup stale domains in SelectedNetworkController:',
      error,
    );
    return state;
  }
}
