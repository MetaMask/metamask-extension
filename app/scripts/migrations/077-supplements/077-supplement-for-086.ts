import { hasProperty, isObject } from '@metamask/utils';

/**
 * Prior to token detection v2 the data property in tokensChainsCache was an array,
 * in v2 we changes that to an object. In this migration we are converting the data as array to object.
 *
 * @param state - The persisted MetaMask state, keyed by controller.
 * @returns Updated versioned MetaMask extension state.
 */
export default function transformState077For086(
  state: Record<string, unknown>,
) {
  if (
    hasProperty(state, 'NetworkController') &&
    isObject(state.NetworkController) &&
    hasProperty(state.NetworkController, 'provider') &&
    hasProperty(state.NetworkController, 'providerConfig')
  ) {
    delete state.NetworkController.provider;
  }

  return { ...state };
}
