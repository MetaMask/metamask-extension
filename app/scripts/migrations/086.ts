import { hasProperty, isObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';

export const version = 86;

/**
 * Rename network controller `provider` state to `providerConfig`.
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
    hasProperty(state, 'NetworkController') &&
    isObject(state.NetworkController) &&
    hasProperty(state.NetworkController, 'provider')
  ) {
    const networkControllerState = state.NetworkController;
    networkControllerState.providerConfig = networkControllerState.provider;
    delete networkControllerState.provider;

    return {
      ...state,
      NetworkController: networkControllerState,
    };
  }
  if (!isObject(state.NetworkController)) {
    global.sentry?.captureException?.(
      new Error(
        `typeof state.NetworkController is ${typeof state.NetworkController}`,
      ),
    );
  } else if (!hasProperty(state.NetworkController, 'provider')) {
    const thePost077SupplementFor086HasNotModifiedState =
      state.NetworkController.providerConfig === undefined;
    if (thePost077SupplementFor086HasNotModifiedState) {
      global.sentry?.captureException?.(
        new Error(
          `typeof state.NetworkController.provider is ${typeof state
            .NetworkController.provider}`,
        ),
      );
    }
  }

  return state;
}
