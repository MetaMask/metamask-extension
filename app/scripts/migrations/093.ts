import { cloneDeep } from 'lodash';
import { hasProperty, isObject } from '@metamask/utils';

export const version = 93;

/**
 * Add ticker to the providerConfig object if missing
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
    hasProperty(state.NetworkController, 'providerConfig') &&
    isObject(state.NetworkController.providerConfig)
  ) {
    const { providerConfig } = state.NetworkController;

    if (providerConfig.ticker) {
      return state;
    }

    state.NetworkController.providerConfig = {
      ticker: 'ETH',
      ...providerConfig,
    };

    return {
      ...state,
      NetworkController: state.NetworkController,
    };
  } else if (!isObject(state.NetworkController)) {
    global.sentry?.captureException?.(
      new Error(
        `typeof state.NetworkController is ${typeof state.NetworkController}`,
      ),
    );
  } else if (
    isObject(state.NetworkController) &&
    !isObject(state.NetworkController.providerConfig)
  ) {
    global.sentry?.captureException?.(
      new Error(
        `typeof state.NetworkController.providerConfig is ${typeof state
          .NetworkController.providerConfig}`,
      ),
    );
  }
  return state;
}
