import { hasProperty, isObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 120.4;

/**
 * This migration removes properties from the CurrencyController state that
 * are no longer used. There presence in state causes "No metadata found" errors
 *
 * @param originalVersionedData - Versioned MetaMask extension state, exactly
 * what we persist to dist.
 * @param originalVersionedData.meta - State metadata.
 * @param originalVersionedData.meta.version - The current state version.
 * @param originalVersionedData.data - The persisted MetaMask state, keyed by
 * controller.
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
 * Remove obsolete CurrencyController state
 *
 * The six properties deleted here were no longer used as of
 * assets-controllers v18.0.0
 *
 * See https://github.com/MetaMask/core/pull/1805 for the removal of these
 * properties from the controller.
 *
 * @param state - The persisted MetaMask state, keyed by controller.
 */
function removeObsoleteCurrencyControllerState(
  state: Record<string, unknown>,
): void {
  if (!hasProperty(state, 'CurrencyController')) {
    return;
  } else if (!isObject(state.CurrencyController)) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: Invalid CurrencyController state of type '${typeof state.CurrencyController}'`,
      ),
    );
    return;
  }

  delete state.CurrencyController.conversionDate;
  delete state.CurrencyController.conversionRate;
  delete state.CurrencyController.nativeCurrency;
  delete state.CurrencyController.pendingCurrentCurrency;
  delete state.CurrencyController.pendingNativeCurrency;
  delete state.CurrencyController.usdConversionRate;
}

/**
 * Remove obsolete PhishingController state
 *
 * @param state - The persisted MetaMask state, keyed by controller.
 */
function removeObsoletePhishingControllerState(
  state: Record<string, unknown>,
): void {
  if (!hasProperty(state, 'PhishingController')) {
    return;
  } else if (!isObject(state.PhishingController)) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: Invalid PhishingController state of type '${typeof state.PhishingController}'`,
      ),
    );
    return;
  }

  delete state.PhishingController.phishing;
  delete state.PhishingController.lastFetched;
}

/**
 * Remove obsolete NetworkController state
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

  delete state.NetworkController.network;
}

/**
 * Remove obsolete controller state.
 *
 * @param state - The persisted MetaMask state, keyed by controller.
 */
function transformState(state: Record<string, unknown>): void {
  removeObsoleteCurrencyControllerState(state);
  removeObsoletePhishingControllerState(state);
  removeObsoleteNetworkControllerState(state);
}
