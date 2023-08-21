import { cloneDeep } from 'lodash';
import { hasProperty, isObject } from '@metamask/utils';

export const version = 84;

/**
 * The `network` property in state was replaced with `networkId` and `networkStatus`.
 *
 * @param originalVersionedData - Versioned MetaMask extension state, exactly what we persist to dist.
 * @param originalVersionedData.meta - State metadata.
 * @param originalVersionedData.meta.version - The current state version.
 * @param originalVersionedData.data - The persisted MetaMask state, keyed by controller.
 * @returns Updated versioned MetaMask extension state.
 */
export async function migrate(originalVersionedData: {
  meta: { version: number };
  data: Record<string, unknown>;
}) {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;
  versionedData.data = transformState(versionedData.data);
  return versionedData;
}

function transformState(state: Record<string, unknown>) {
  if (
    !hasProperty(state, 'NetworkController') ||
    !isObject(state.NetworkController)
  ) {
    global.sentry?.captureException?.(
      new Error(
        `typeof state.NetworkController is ${typeof state.NetworkController}`,
      ),
    );
    return state;
  }
  if (!hasProperty(state.NetworkController, 'network')) {
    const thePost077SupplementFor084HasNotModifiedState =
      state.NetworkController.networkId === undefined;
    if (thePost077SupplementFor084HasNotModifiedState) {
      global.sentry?.captureException?.(
        new Error(
          `typeof state.NetworkController.network is ${typeof state
            .NetworkController.network}`,
        ),
      );
    }
    return state;
  }

  const NetworkController = { ...state.NetworkController };

  if (NetworkController.network === 'loading') {
    NetworkController.networkId = null;
    NetworkController.networkStatus = 'unknown';
  } else {
    NetworkController.networkId = NetworkController.network;
    NetworkController.networkStatus = 'available';
  }

  delete NetworkController.network;

  return { ...state, NetworkController };
}
