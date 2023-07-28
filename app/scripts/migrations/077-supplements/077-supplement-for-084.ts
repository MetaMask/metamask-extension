import { hasProperty, isObject } from '@metamask/utils';

/**
 * Prior to token detection v2 the data property in tokensChainsCache was an array,
 * in v2 we changes that to an object. In this migration we are converting the data as array to object.
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
