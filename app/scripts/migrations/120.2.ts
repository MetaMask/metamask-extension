import { cloneDeep } from 'lodash';
import { hasProperty, isObject } from '@metamask/utils';
import log from 'loglevel';
import { captureException } from '../../../shared/lib/sentry';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 120.2;

/**
 * This migration removes obsolete state from various controllers. In all cases, this was done to
 * address Sentry errors.
 *
 * @param originalVersionedData - Versioned MetaMask extension state, exactly what we persist to dist.
 * @param originalVersionedData.meta - State metadata.
 * @param originalVersionedData.meta.version - The current state version.
 * @param originalVersionedData.data - The persisted MetaMask state, keyed by controller.
 * @returns Updated versioned MetaMask extension state.
 */
export async function migrate(
  originalVersionedData: VersionedData,
): Promise<VersionedData> {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;
  transformState(versionedData.data);
  return versionedData;
}

/**
 * Remove obsolete SnapController state
 *
 * The `snapErrors` property was never intended to be persisted, but the initial state for this
 * property was accidentally persisted for some users due to a bug. See #26280 for details.
 *
 * @param state - The persisted MetaMask state, keyed by controller.
 */
function removeObsoleteSnapControllerState(
  state: Record<string, unknown>,
): void {
  if (!hasProperty(state, 'SnapController')) {
    return;
  } else if (!isObject(state.SnapController)) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: Invalid SnapController state of type '${typeof state.SnapController}'`,
      ),
    );
    return;
  }

  delete state.SnapController.snapErrors;
}

/**
 * Remove obsolete `perDomainNetwork` property from SelectedNetworkController state.
 *
 * We don't know exactly why yet, but we see from Sentry that some users have this property still
 * in state. It is no longer used.
 *
 * If we detect that the state is corrupted or that this property is present, we are fixing it by
 * erasing the state. The consequences of this state being erased are minimal, and this was easier
 * than fixing state corruption without resetting it.
 *
 * @param state - The persisted MetaMask state, keyed by controller.
 */
function removeObsoleteSelectedNetworkControllerState(
  state: Record<string, unknown>,
): void {
  if (!hasProperty(state, 'SelectedNetworkController')) {
    return;
  }
  if (!isObject(state.SelectedNetworkController)) {
    console.error(
      `Migration ${version}: Invalid SelectedNetworkController state of type '${typeof state.SelectedNetworkController}'`,
    );
    delete state.SelectedNetworkController;
  } else if (hasProperty(state.SelectedNetworkController, 'perDomainNetwork')) {
    delete state.SelectedNetworkController;
  }
}

/**
 * Remove obsolete NetworkController state.
 *
 * We don't know exactly why yet, but we see from Sentry that some users have these properties
 * in state. They should have been removed by migrations long ago. They are no longer used.
 *
 * @param state - The persisted MetaMask state, keyed by controller.
 */
function removeObsoleteNetworkControllerState(
  state: Record<string, unknown>,
): void {
  if (!hasProperty(state, 'NetworkController')) {
    return;
  } else if (!isObject(state.NetworkController)) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: Invalid NetworkController state of type '${typeof state.NetworkController}'`,
      ),
    );
    return;
  }

  const networkControllerState = state.NetworkController;

  // Check for invalid `providerConfig.id`, and remove if found
  if (
    hasProperty(networkControllerState, 'providerConfig') &&
    // This should be impossible because `undefined` cannot be returned from persisted state,
    // it's not valid JSON. But a bug in migration 14 ends up setting this to `undefined`.
    networkControllerState.providerConfig !== undefined
  ) {
    if (!isObject(networkControllerState.providerConfig)) {
      global.sentry?.captureException?.(
        new Error(
          `Migration ${version}: Invalid NetworkController providerConfig state of type '${typeof state
            .NetworkController.providerConfig}'`,
        ),
      );
      return;
    }
    const { providerConfig } = networkControllerState;

    const validNetworkConfigurationIds = [];
    if (hasProperty(networkControllerState, 'networkConfigurations')) {
      if (!isObject(networkControllerState.networkConfigurations)) {
        global.sentry?.captureException?.(
          new Error(
            `Migration ${version}: Invalid NetworkController networkConfigurations state of type '${typeof networkControllerState.networkConfigurations}'`,
          ),
        );
        return;
      }

      validNetworkConfigurationIds.push(
        ...Object.keys(networkControllerState.networkConfigurations),
      );
    }

    if (hasProperty(providerConfig, 'id')) {
      if (
        typeof providerConfig.id !== 'string' ||
        !validNetworkConfigurationIds.includes(providerConfig.id)
      ) {
        log.warn(
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31893
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          `Migration ${version}: Removing invalid provider id ${providerConfig.id}`,
        );
        delete providerConfig.id;
      }
    }
  }

  delete networkControllerState.networkDetails;
  delete networkControllerState.networkId;
  delete networkControllerState.networkStatus;
  delete networkControllerState.previousProviderStore;
  delete networkControllerState.provider;
}

/**
 * Remove obsolete `listState` property from PhishingController state.
 *
 * We don't know exactly why yet, but we see from Sentry that some users have this property still
 * in state. It is no longer used.
 *
 * @param state - The persisted MetaMask state, keyed by controller.
 */
function removeObsoletePhishingControllerState(
  state: Record<string, unknown>,
): void {
  if (!hasProperty(state, 'PhishingController')) {
    return;
  } else if (!isObject(state.PhishingController)) {
    captureException(
      new Error(
        `Migration ${version}: Invalid PhishingController state of type '${typeof state.PhishingController}'`,
      ),
    );
    return;
  }
  if (hasProperty(state.PhishingController, 'listState')) {
    delete state.PhishingController.listState;
  }
}

/**
 * Remove obsolete controller state.
 *
 * @param state - The persisted MetaMask state, keyed by controller.
 */
function transformState(state: Record<string, unknown>): void {
  removeObsoleteSnapControllerState(state);
  removeObsoleteSelectedNetworkControllerState(state);
  removeObsoleteNetworkControllerState(state);
  removeObsoletePhishingControllerState(state);
}
