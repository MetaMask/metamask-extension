import { hasProperty, isObject } from '@metamask/utils';
import {
  METHOD_DISPLAY_STATE_CORRUPTION_ERROR,
  METHOD_REPAIR_DATABASE,
} from '../../../../shared/constants/state-corruption';
import { type Backup, PersistenceManager } from '../stores/persistence-manager';
import { ErrorLike } from '../../../../shared/constants/errors';
import { tryPostMessage } from '../start-up-errors/start-up-errors';
import { RELOAD_WINDOW } from '../../../../shared/constants/start-up-errors';

type Message = Parameters<chrome.runtime.Port['postMessage']>[0];

export type HandleStateCorruptionErrorConfig = {
  port: chrome.runtime.Port;
  error: ErrorLike;
  database: PersistenceManager;
  repairCallback: (backup: Backup | null) => void | Promise<void>;
};

const REPAIR_LOCK_NAME = 'repairDatabase';

/**
 * Requests a lock for the repair operation. This is used to ensure that only
 * one repair operation is happening at a time. If the lock is available it will
 * call and await the provided `repairDatabase` function then return true. If
 * the lock is not available, it will return false and the callback will *not*
 * be called.
 *
 * @param repairDatabase - A function that is called only when the request is
 * granted.
 */
async function requestRepair(
  repairDatabase: () => Promise<void> | (() => void),
): Promise<boolean> {
  return await navigator.locks.request(
    REPAIR_LOCK_NAME,
    { ifAvailable: true },
    async function requestRepairLockCallback(lock) {
      // something is already repairing the database
      if (lock === null) {
        return false;
      }

      await repairDatabase();
      return true;
    },
  );
}

/**
 * Attempts to get a backup from the database. If the error passed in has a
 * `backup` property, it will use that instead of reading from the database.
 * This is useful for errors that are thrown during the backup process, as
 * they may already have a backup object on them.
 *
 * @param error - The error that caused the state corruption.
 * @param database - The database to get the backup from.
 */
async function maybeGetBackup(
  error: ErrorLike,
  database: PersistenceManager,
): Promise<Backup | null> {
  /**
   * A STATE_CORRUPTION_ERROR may have a `backup` property already on it,
   * if it does, we can use it without reading from the DB again.
   */
  let backup =
    isObject(error) && hasProperty(error, 'backup') && error.backup !== null
      ? (error.backup as Backup)
      : null;
  if (!backup) {
    try {
      backup = (await database.getBackup()) ?? null;
    } catch {
      // ignore errors here since we're already in an error state, we really
      // only care about the error that got us here.
      backup = null;
    }
  }
  return backup;
}

/**
 * Attempts to get the current locale from the backup.
 *
 * @param backup - The backup object to extract the locale from.
 * @returns The current locale if found, otherwise null.
 */
function maybeGetCurrentLocale(backup: Backup | null): string | null {
  // we're overly defensive here because we have no idea what happened to the
  // database, and we don't want to throw another error on some unexpected object.
  if (isObject(backup) && hasProperty(backup, 'PreferencesController')) {
    const preferencesController = backup.PreferencesController;
    if (
      isObject(preferencesController) &&
      hasProperty(preferencesController, 'currentLocale') &&
      typeof preferencesController.currentLocale === 'string'
    ) {
      return preferencesController.currentLocale;
    }
  }
  return null;
}

/**
 * Checks if the backup object has a vault.
 *
 * @param backup - The backup object to check for a vault.
 * @returns True if the vault exists, otherwise false.
 */
export function hasVault(backup: Backup | null): boolean {
  // we're overly defensive here because we have no idea what happened to the
  // database, and we don't want to throw another error on some unexpected object.
  if (isObject(backup) && hasProperty(backup, 'KeyringController')) {
    const keyringController = backup.KeyringController;
    if (
      isObject(keyringController) &&
      hasProperty(keyringController, 'vault')
    ) {
      return Boolean(keyringController.vault);
    }
  }
  return false;
}

export class CorruptionHandler {
  /**
   * Stores the connected ports that are used to send messages to the UI. This is
   * used to ensure that only one repair operation is happening at a time, and to
   * allow the UI to listen for messages from the background. The ports are stored
   * in a Set to ensure that there are no duplicates. The ports are removed from
   * the Set when they are disconnected.
   */
  connectedPorts = new Set<chrome.runtime.Port>();

  /**
   * Handles a state corruption error by sending a message to the UI and
   * initiating a repair process if requested by the UI port.
   *
   * @param config - The configuration parameters for handling the state
   * corruption error.
   * @param config.port - The port to send the error message to.
   * @param config.error - The error that caused the state corruption.
   * @param config.database - The database to get the backup from.
   * @param config.repairCallback - The function to call to repair the database.
   */
  async handleStateCorruptionError({
    port,
    error,
    database,
    repairCallback,
  }: HandleStateCorruptionErrorConfig): Promise<void> {
    const { connectedPorts } = this;
    const backup = await maybeGetBackup(error, database);
    const currentLocale = maybeGetCurrentLocale(backup);
    // it is not worth claiming we have a backup if the vault doesn't actually
    // exist
    const hasBackup = Boolean(hasVault(backup));

    // send the `error` to the UI for this port
    const sent = tryPostMessage(port, METHOD_DISPLAY_STATE_CORRUPTION_ERROR, {
      error: {
        message: error.message,
        name: error.name,
        stack: error.stack,
      },
      currentLocale,
      hasBackup,
    });
    if (!sent) {
      return Promise.resolve();
    }

    // if we successfully sent the error to the UI, listen for a "restore"
    // method call back to us
    return new Promise((resolve, reject) => {
      connectedPorts.add(port);
      port.onDisconnect.addListener(onDisconnect);
      port.onMessage.addListener(restoreVaultListener);

      // remove from `connectedPorts` if the port disconnects. this is
      // automatically called when the UI closes
      function onDisconnect() {
        connectedPorts.delete(port);
        resolve();
      }
      /**
       * Listens for a message from the UI to restore the vault. If the message
       * is received, it will call the `repair` function with the backup and
       * reload the UI. It will also unregister the listener from all UI windows
       * to prevent multiple restore requests.
       *
       * @param message - The message sent from the UI to the background.
       */
      async function restoreVaultListener(message: Message) {
        if (message?.data?.method === METHOD_REPAIR_DATABASE) {
          // only allow the restore process once, unregister
          // `restoreVaultListener` listeners from all UI windows
          connectedPorts.forEach((connectedPort) =>
            connectedPort.onMessage.removeListener(restoreVaultListener),
          );

          try {
            await requestRepair(async function repairDatabase() {
              // this callback might be ignored if another repair request
              // is already in progress.

              try {
                await repairCallback(backup);
              } finally {
                // always reload the UI because if `initBackground` worked, the UI
                // will redirect to the login screen, and if it didn't work, it'll
                // show them a new error message (which could be the same as the
                // vault error that sent them here in the first place, but hopefully
                // not!)
                connectedPorts.forEach((connectedPort) => {
                  // as each page reloads, it will remove itself from the
                  // `connectedPorts` on disconnection.
                  tryPostMessage(connectedPort, RELOAD_WINDOW);
                });
              }
            });
            resolve();
          } catch (e) {
            reject(e);
          }
        }
      }
    });
  }
}
