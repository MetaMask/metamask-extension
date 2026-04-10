/**
 * snap-management
 *
 * Snap keyring access and snap-related preference queries.
 * All controller access via messenger — no chrome.* / browser.* imports.
 *
 * Mobile convergence:
 *   - getSnapKeyring  (Engine.ts L1041: same SnapController.getKeyringForType pattern)
 *   - getPreferences  (Engine.ts L1016: same fields subset)
 *
 * Remaining methods not yet extracted (4 of 6):
 *   handleSnapRequest, handleWatchAssetRequest,
 *   getSnapState, updateSnapState
 */

import type { RootMessenger } from '../../messenger';

export type SnapManagementDependencies = {
  messenger: RootMessenger;
};

/**
 * Returns the snap keyring instance, initializing it if necessary.
 * Required before any snap-keyring account operations.
 *
 * Extracted from MetamaskController.getSnapKeyring.
 * Same pattern as mobile Engine.ts L1041.
 *
 * TODO: Requires messenger action: SnapController:getKeyringForType
 */
export async function getSnapKeyring(
  deps: SnapManagementDependencies,
): Promise<unknown> {
  return deps.messenger.call('SnapController:getKeyringForType', 'Snap Account');
}

/**
 * Returns the snap-relevant subset of user preferences.
 * Used by snap-keyring to deliver locale and currency context to snaps.
 *
 * Extracted from MetamaskController snap preferences helper.
 * Same fields as mobile Engine.ts L1016.
 *
 * TODO: Requires messenger action: PreferencesController:getState
 */
export function getSnapPreferences(deps: SnapManagementDependencies): {
  locale: string;
  currency: string;
  useTokenDetection: boolean;
} {
  const state = deps.messenger.call('PreferencesController:getState');
  return {
    locale: state.currentLocale,
    currency: state.currentCurrency,
    useTokenDetection: state.useTokenDetection,
  };
}
