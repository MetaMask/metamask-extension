import { AccountTreeController } from '@metamask/account-tree-controller';
import { ControllerInitFunction } from '../types';
import { AccountTreeControllerMessenger } from '../messengers/accounts';
import { trace } from '../../../../shared/lib/trace';
import { AccountTreeControllerInitMessenger } from '../messengers/accounts/account-tree-controller-messenger';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';

/**
 * Initialize the account wallet controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @param request.initMessenger - The init messenger to use for the controller.
 * @returns The initialized controller.
 */
export const AccountTreeControllerInit: ControllerInitFunction<
  AccountTreeController,
  AccountTreeControllerMessenger,
  AccountTreeControllerInitMessenger
> = ({ controllerMessenger, persistedState, initMessenger }) => {
  const controller = new AccountTreeController({
    messenger: controllerMessenger,
    state: persistedState.AccountTreeController,
    config: {
      // @ts-expect-error Controller uses string for names rather than enum
      trace,
      backupAndSync: {
        onBackupAndSyncEvent: (event) => {
          initMessenger.call('MetaMetricsController:trackEvent', {
            category: MetaMetricsEventCategory.BackupAndSync,
            event: MetaMetricsEventName.ProfileActivityUpdated,
            properties: {
              // @ts-expect-error events coming from the controller are typed and this conflicts with the expected Record<string, Json> type
              event,
            },
          });
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
