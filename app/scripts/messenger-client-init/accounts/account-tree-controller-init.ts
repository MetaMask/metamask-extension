import {
  AccountTreeController,
  AccountTreeControllerMessenger,
} from '@metamask/account-tree-controller';
import { MessengerClientInitFunction } from '../types';
import { trace } from '../../../../shared/lib/trace';
import { AccountTreeControllerInitMessenger } from '../messengers/accounts/account-tree-controller-messenger';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { createEventBuilder, trackEvent } from '../../controllers/analytics';

/**
 * Initialize the account wallet controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @returns The initialized controller.
 */
export const AccountTreeControllerInit: MessengerClientInitFunction<
  AccountTreeController,
  AccountTreeControllerMessenger,
  AccountTreeControllerInitMessenger
> = ({ controllerMessenger, persistedState }) => {
  const messengerClient = new AccountTreeController({
    messenger: controllerMessenger,
    state: persistedState.AccountTreeController,
    config: {
      // @ts-expect-error Controller uses string for names rather than enum
      trace,
      backupAndSync: {
        onBackupAndSyncEvent: (event) => {
          trackEvent(
            createEventBuilder(MetaMetricsEventName.ProfileActivityUpdated)
              .addCategory(MetaMetricsEventCategory.BackupAndSync)
              .addProperties({
                ...event,
              })
              .build(),
          );
        },
      },
    },
  });

  // Re-build initial account wallet tree.
  // FIXME: We cannot do call `init` here, since we need to have the `KeyringController`'s
  // state to be "ready" (thus, unlocked). So we instead follow the same pattern than
  // the `AccountsController.updateAccounts` method and re-construct the tree at the
  // same time.

  return { messengerClient };
};
