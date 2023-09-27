import { hasProperty, isObject } from '@metamask/utils';

/**
 * Deletes frequentRpcListDetail if networkConfigurations exists, on the NetworkController state.
 * Further explanation in ./077-supplements.md
 *
 * @param state - The persisted MetaMask state, keyed by controller.
 * @returns Updated versioned MetaMask extension state.
 */

export default function transformState077For082(
  state: Record<string, unknown>,
) {
  if (
    hasProperty(state, 'PreferencesController') &&
    isObject(state.PreferencesController) &&
    hasProperty(state.PreferencesController, 'frequentRpcListDetail') &&
    isObject(state.NetworkController) &&
    hasProperty(state.NetworkController, 'networkConfigurations')
  ) {
    delete state.PreferencesController.frequentRpcListDetail;
  }

  return { ...state };
}
