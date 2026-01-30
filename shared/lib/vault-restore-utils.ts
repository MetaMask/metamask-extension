import type browser from 'webextension-polyfill';
import { METHOD_REPAIR_DATABASE } from '../constants/state-corruption';
import { t } from './translate';

/**
 * Shows a confirmation dialog and triggers the vault restore process if confirmed.
 * This is used by both the state corruption screen and the critical error screen
 * to initiate vault recovery from the IndexedDB backup.
 *
 * @param port - The browser runtime port for communication with the background script.
 * @returns True if the user confirmed and the restore was triggered, false otherwise.
 */
export function confirmAndTriggerVaultRestore(
  port: browser.Runtime.Port,
): boolean {
  // eslint-disable-next-line no-alert
  const theyAreSure = confirm(t('stateCorruptionAreYouSure') ?? '');
  if (theyAreSure) {
    port.postMessage({
      data: {
        method: METHOD_REPAIR_DATABASE,
      },
    });
    return true;
  }
  return false;
}
