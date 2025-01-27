import { hasProperty, isObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 140;

/**
 * This migration deletes properties from state which have been removed in
 * previous commits.
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

function transformState(state: Record<string, unknown>) {
  if (
    hasProperty(state, 'AppStateController') &&
    isObject(state.AppStateController)
  ) {
    // Removed in 33cc8d587aad05c0b41871ba3676676a3ce5680e with a migration, but
    // still persists for some people for some reason
    // See https://metamask.sentry.io/issues/6223008336/events/723c5195130e4c5584b53a6656a85595/
    delete state.AppStateController.collectiblesDropdownState;
    // Removed in 4ea52511eb7934bf0ce6b9b7d570a525120229ce
    delete state.AppStateController.serviceWorkerLastActiveTime;
    // Removed in 24e0a9030b1a715a008e0c5dfaf9c552bcdb304e with a migration, but
    // still persists for some people for some reason
    // See https://metamask.sentry.io/issues/6223008336/events/a2cc42d6ed79485a8b2e9072d8033720/
    delete state.AppStateController.showPortfolioTooltip;
  }

  if (
    hasProperty(state, 'NetworkController') &&
    isObject(state.NetworkController)
  ) {
    // Removed in 555d42b9ead0f4919356ff16e11c663c5e38639e
    delete state.NetworkController.networkConfigurations;
    // Removed in 800a9d3a177446ff2d05e3e95ec06b3658474207 with a migration, but
    // still persists for some people for some reason
    // See: https://metamask.sentry.io/issues/6011869130/events/039861ddb07f4b39b947edba3bbd710e/
    delete state.NetworkController.providerConfig;
  }

  if (
    hasProperty(state, 'PreferencesController') &&
    isObject(state.PreferencesController)
  ) {
    // Removed in 6c84e9604c7160dd91c685f301f3c8bd128ad3e3
    delete state.PreferencesController.customNetworkListEnabled;
    // Removed in e6ecd956b054a29481071e4eded2f8cd17d137d2
    delete state.PreferencesController.disabledRpcMethodPreferences;
    // Removed in 8125473dc53476b6685c5e85918f89bce87e3006
    delete state.PreferencesController.eip1559V2Enabled;
    // Removed in 699ddccc76302df6130835dc6655077806bf6335
    delete state.PreferencesController.hasDismissedOpenSeaToBlockaidBanner;
    // I could find references to this in the commit history, but don't know
    // where it was removed
    delete state.PreferencesController.hasMigratedFromOpenSeaToBlockaid;
    // Removed in f988dc1c5ef98ec72212d1f58e736556273b68f7
    delete state.PreferencesController.improvedTokenAllowanceEnabled;
    // Removed in 315c043785cd5d7a4b0f7e974097ccac18a6b241
    delete state.PreferencesController.infuraBlocked;
    // Removed in 4f66dc948fee54b8491227414342ab0d373475f1 with a migration, but
    // still persists for some people for some reason
    // See: https://metamask.sentry.io/issues/6042074159/events/5711f95785d741739e5d0fa5ad19e7c0/
    delete state.PreferencesController.useCollectibleDetection;
    // Removed in eb987a47b51ce410de0047ec883bb4549ce80c85
    delete state.PreferencesController.useStaticTokenList;
  }

  return state;
}
