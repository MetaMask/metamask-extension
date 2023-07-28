import { hasProperty, isObject } from '@metamask/utils';

/**
 * Deletes frequentRpcListDetail if networkConfigurations exists, on the NetworkController state.
 * Further explanation in ./077-supplements.md
 */

export default function transformState077For082(state) {
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
