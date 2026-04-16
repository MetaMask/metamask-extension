import {
  DelegationController,
  DelegationEntry,
  type DelegationControllerMessenger,
} from '@metamask/delegation-controller';
import {
  type TransactionMeta,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { type Hex } from '../../../../shared/lib/delegation/utils';
import {
  getDelegationHashOffchain,
  getDeleGatorEnvironment,
} from '../../../../shared/lib/delegation';
import type { DelegationControllerInitMessenger } from '../messengers/delegation/delegation-controller-messenger';
import type { MessengerClientInitFunction } from '../types';

const getDelegationEnvironment = (chainId: Hex) => {
  return getDeleGatorEnvironment(Number(chainId));
};

/**
 * Initialize the Delegation controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @param request.initMessenger - The initialization messenger for the controller.
 * @returns The initialized controller.
 */
export const DelegationControllerInit: MessengerClientInitFunction<
  DelegationController,
  DelegationControllerMessenger,
  DelegationControllerInitMessenger
> = ({ controllerMessenger, persistedState, initMessenger }) => {
  const messengerClient = new DelegationController({
    messenger: controllerMessenger,
    state: persistedState.DelegationController,
    hashDelegation: getDelegationHashOffchain,
    getDelegationEnvironment,
  });

  controllerMessenger.registerActionHandler(
    'DelegationController:signDelegation',
    messengerClient.signDelegation.bind(messengerClient),
  );

  return {
    messengerClient,
    api: {
      signDelegation: messengerClient.signDelegation.bind(messengerClient),
      storeDelegationEntry: messengerClient.store.bind(messengerClient),
      listDelegationEntries: messengerClient.list.bind(messengerClient),
      getDelegationEntry: messengerClient.retrieve.bind(messengerClient),
      getDelegationEntryChain: messengerClient.chain.bind(messengerClient),
      deleteDelegationEntry: messengerClient.delete.bind(messengerClient),
      awaitDeleteDelegationEntry: awaitDeleteDelegationEntry.bind(
        null,
        messengerClient,
        initMessenger,
      ),
    },
  };
};

/**
 * Awaits for the transaction with txMeta to be confirmed, then
 * deletes the delegation entry with `hash`.
 *
 * @param messengerClient - The DelegationController.
 * @param initMessenger - The initialization messenger for the controller.
 * @param options
 * @param options.hash - The hash of the delegation entry to delete.
 * @param options.txMeta - The transaction meta of the transaction that confirmed the delegation entry.
 * @param options.entryToStore - The delegation entry to store.
 */
export async function awaitDeleteDelegationEntry(
  messengerClient: DelegationController,
  initMessenger: DelegationControllerInitMessenger,
  {
    hash,
    txMeta,
    entryToStore,
  }: { hash: Hex; txMeta: TransactionMeta; entryToStore?: DelegationEntry },
) {
  let { id } = txMeta;
  let action: 'continue' | 'unsubscribe' | 'delete' = 'continue';

  const handleTransactionStatusUpdated = ({
    transactionMeta,
  }: {
    transactionMeta: TransactionMeta;
  }) => {
    // If not our transaction, ignore
    if (transactionMeta.id !== id) {
      return;
    }

    // Check if transaction was replaced
    if (
      transactionMeta.status === TransactionStatus.dropped &&
      transactionMeta.replacedById
    ) {
      id = transactionMeta.replacedById;
      return;
    }

    switch (transactionMeta.type) {
      case TransactionType.contractInteraction:
      case TransactionType.retry:
        switch (transactionMeta.status) {
          case TransactionStatus.confirmed:
            action = 'delete';
            break;
          case TransactionStatus.dropped:
          case TransactionStatus.failed:
          case TransactionStatus.rejected:
            action = 'unsubscribe';
            break;
          default:
            // Ignore other statuses
            return;
        }
        break;
      case TransactionType.cancel:
        action = 'unsubscribe';
        break;
      default:
        console.warn(
          'awaitDeleteDelegationEntry: Unexpected tx type',
          transactionMeta.type,
        );
        return;
    }

    if (action === 'delete') {
      messengerClient.delete(hash);
      if (entryToStore) {
        messengerClient.store({ entry: entryToStore });
      }
    }

    if (action === 'unsubscribe' || action === 'delete') {
      initMessenger.unsubscribe(
        'TransactionController:transactionStatusUpdated',
        handleTransactionStatusUpdated,
      );
    }
  };

  initMessenger.subscribe(
    'TransactionController:transactionStatusUpdated',
    handleTransactionStatusUpdated,
  );
}
