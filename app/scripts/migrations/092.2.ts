import { cloneDeep } from 'lodash';

type MetaMaskState = Record<string, unknown>;
type VersionedState = {
  meta: { version: number };
  data: MetaMaskState;
};

export const version = 92.2;

/**
 * This migration removes obsolete NetworkController state properties.
 *
 * @param originalVersionedState - Versioned MetaMask extension state, exactly what we persist to dist.
 * @param originalVersionedState.meta - State metadata.
 * @param originalVersionedState.meta.version - The current state version.
 * @param originalVersionedState.data - The persisted MetaMask state, keyed by controller.
 * @returns Updated versioned of MetaMask extension state.
 */
export async function migrate(
  originalVersionedState: VersionedState,
): Promise<VersionedState> {
  const updatedVersionedState = cloneDeep(originalVersionedState);

  updatedVersionedState.meta.version = version;
  updatedVersionedState.data = transformState(updatedVersionedState.data);

  return updatedVersionedState;
}

function transformState(originalState: MetaMaskState): MetaMaskState {
  const updatedState =
    filterOutObsoleteNetworkControllerStateProperties(originalState);

  return updatedState;
}

function filterOutObsoleteNetworkControllerStateProperties(
  state: MetaMaskState,
): MetaMaskState {
  // https://github.com/MetaMask/core/blob/%40metamask/network-controller%4010.3.1/packages/network-controller/src/NetworkController.ts#L336-L342
  const CURRENT_NETWORK_CONTROLLER_STATE_PROPS = [
    'networkId',
    'networkStatus',
    'providerConfig',
    'networkDetails',
    'networkConfigurations',
  ];

  const networkControllerState: Record<string, any> =
    state.NetworkController || {};
  const networkControllerStateProps = Object.keys(networkControllerState);

  // delete network state properties that are not currently in use
  for (let p = 0; p < networkControllerStateProps.length; p++) {
    if (
      !CURRENT_NETWORK_CONTROLLER_STATE_PROPS.includes(
        networkControllerStateProps[p],
      )
    ) {
      delete networkControllerState[networkControllerStateProps[p]];
    }
  }

  return state;
}
