import {
  AccountTreeController,
  AccountTreeControllerMessenger,
} from '@metamask/account-tree-controller';
import { AccountId } from '@metamask/keyring-utils';
import { MessengerClientInitFunction } from '../types';
import {
  TraceName,
  trace,
  type TraceCallback,
  type TraceContext,
  type TraceRequest,
} from '../../../../shared/lib/trace';
import { AccountTreeControllerInitMessenger } from '../messengers/accounts/account-tree-controller-messenger';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';

const ACCOUNT_SYNC_ROOT_TRACE_NAMES = new Set<string>([
  TraceName.AccountSyncFull,
]);

function traceWithAccountSyncRootBoundary<ResultType>(
  request: TraceRequest,
  fn: TraceCallback<ResultType>,
): ResultType;
function traceWithAccountSyncRootBoundary(request: TraceRequest): TraceContext;
function traceWithAccountSyncRootBoundary<ResultType>(
  request: TraceRequest,
  fn?: TraceCallback<ResultType>,
): ResultType | TraceContext {
  const boundedRequest = ACCOUNT_SYNC_ROOT_TRACE_NAMES.has(request.name)
    ? { ...request, root: true }
    : request;
  return fn ? trace(boundedRequest, fn) : trace(boundedRequest);
}

/**
 * Initialize the account wallet controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @param request.initMessenger - The init messenger to use for the controller.
 * @returns The initialized controller.
 */
export const AccountTreeControllerInit: MessengerClientInitFunction<
  AccountTreeController,
  AccountTreeControllerMessenger,
  AccountTreeControllerInitMessenger
> = ({ controllerMessenger, persistedState, initMessenger }) => {
  const messengerClient = new AccountTreeController({
    messenger: controllerMessenger,
    state: persistedState.AccountTreeController,
    config: {
      // @ts-expect-error Controller uses string for names rather than enum
      trace: traceWithAccountSyncRootBoundary,
      backupAndSync: {
        onBackupAndSyncEvent: (event) => {
          initMessenger.call('MetaMetricsController:trackEvent', {
            category: MetaMetricsEventCategory.BackupAndSync,
            event: MetaMetricsEventName.ProfileActivityUpdated,
            // @ts-expect-error events coming from the controller are typed and this conflicts with the expected Record<string, Json> type
            properties: {
              ...event,
            },
          });
        },
      },
      accountOrderCallbacks: {
        isHiddenAccount: (accountId: AccountId) => {
          const internalAccount = initMessenger.call(
            'AccountsController:getAccount',
            accountId,
          );
          if (!internalAccount) {
            return false;
          }

          const accountOrderState = initMessenger.call(
            'AccountOrderController:getState',
          );
          return accountOrderState.hiddenAccountList.includes(
            internalAccount.address,
          );
        },
        isPinnedAccount: (accountId: AccountId) => {
          const internalAccount = initMessenger.call(
            'AccountsController:getAccount',
            accountId,
          );
          if (!internalAccount) {
            return false;
          }
          const accountOrderState = initMessenger.call(
            'AccountOrderController:getState',
          );

          return accountOrderState.pinnedAccountList.includes(
            internalAccount.address,
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
