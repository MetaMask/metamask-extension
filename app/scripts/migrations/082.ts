import { cloneDeep } from 'lodash';
import { hasProperty, isObject } from '@metamask/utils';
import { v4 } from 'uuid';
import log from 'loglevel';

export const version = 82;

/**
 * Migrate the frequentRpcListDetail from the PreferencesController to the NetworkController, convert it from an array to an object
 * keyed by random uuids.
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
  if (!hasProperty(state, 'PreferencesController')) {
    log.warn(`state.PreferencesController is undefined`);
    return state;
  }
  if (!isObject(state.PreferencesController)) {
    global.sentry?.captureException?.(
      new Error(
        `typeof state.PreferencesController is ${typeof state.PreferencesController}`,
      ),
    );
    return state;
  }
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
  if (
    !hasProperty(state.PreferencesController, 'frequentRpcListDetail') ||
    !Array.isArray(state.PreferencesController.frequentRpcListDetail)
  ) {
    const inPost077SupplementFor082State =
      state.NetworkController.networkConfigurations &&
      state.PreferencesController.frequentRpcListDetail === undefined;
    if (!inPost077SupplementFor082State) {
      global.sentry?.captureException?.(
        new Error(
          `typeof state.PreferencesController.frequentRpcListDetail is ${typeof state
            .PreferencesController.frequentRpcListDetail}`,
        ),
      );
    }
    return state;
  }
  if (!state.PreferencesController.frequentRpcListDetail.every(isObject)) {
    const erroneousElement =
      state.PreferencesController.frequentRpcListDetail.find(
        (element) => !isObject(element),
      );
    global.sentry?.captureException?.(
      new Error(
        `state.PreferencesController.frequentRpcListDetail contains an element of type ${typeof erroneousElement}`,
      ),
    );
    return state;
  }
  const { PreferencesController, NetworkController } = state;
  const { frequentRpcListDetail } = PreferencesController;
  if (!Array.isArray(frequentRpcListDetail)) {
    return state;
  }

  const networkConfigurations = frequentRpcListDetail.reduce(
    (
      networkConfigurationsAcc,
      { rpcUrl, chainId, ticker, nickname, rpcPrefs },
    ) => {
      const networkConfigurationId = v4();
      return {
        ...networkConfigurationsAcc,
        [networkConfigurationId]: {
          rpcUrl,
          chainId,
          ticker,
          rpcPrefs,
          nickname,
        },
      };
    },
    {},
  );

  delete PreferencesController.frequentRpcListDetail;

  return {
    ...state,
    NetworkController: {
      ...NetworkController,
      networkConfigurations,
    },
    PreferencesController: {
      ...PreferencesController,
    },
  };
}
