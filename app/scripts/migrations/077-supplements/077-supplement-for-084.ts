import { hasProperty, isObject } from '@metamask/utils';

/**
 * Deletes network if networkId exists, on the NetworkController state.
 * Further explanation in ./077-supplements.md
 */

export default function transformState077For084(state) {
  if (
    hasProperty(state, 'NetworkController') &&
    isObject(state.NetworkController) &&
    hasProperty(state.NetworkController, 'network') &&
    hasProperty(state.NetworkController, 'networkId')
  ) {
    delete state.NetworkController.network;
  }

  return { ...state };
}
