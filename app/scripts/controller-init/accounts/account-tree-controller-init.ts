import { AccountTreeController } from '@metamask/account-tree-controller';
import { ControllerInitFunction } from '../types';
import { AccountTreeControllerMessenger } from '../messengers/accounts';
import { trace } from '../../../../shared/lib/trace';

/**
 * Initialize the account wallet controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @returns The initialized controller.
 */
export const AccountTreeControllerInit: ControllerInitFunction<
  AccountTreeController,
  AccountTreeControllerMessenger
> = ({ controllerMessenger, persistedState }) => {
  const controller = new AccountTreeController({
    messenger: controllerMessenger,
    state: persistedState.AccountTreeController,
    config: {
      // @ts-expect-error Controller uses string for names rather than enum
      trace,
      backupAndSync: {
        onBackupAndSyncEvent: (event) => {
          // Handle backup and sync events here, e.g., logging or tracking.
          console.log('Backup and Sync Event:', event);
        },
      },
    },
  });

  // Re-build initial account wallet tree.
  // FIXME: We cannot do call `init` here, since we need to have the `KeyringController`'s
  // state to be "ready" (thus, unlocked). So we instead follow the same pattern than
  // the `AccountsController.updateAccounts` method and re-construct the tree at the
  // same time.

  return { controller };
};
