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
import type { ControllerInitFunction } from '../types';

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
export const DelegationControllerInit: ControllerInitFunction<
  DelegationController,
  DelegationControllerMessenger,
  DelegationControllerInitMessenger
> = ({ controllerMessenger, persistedState, initMessenger }) => {
  const controller = new DelegationController({
    messenger: controllerMessenger,
    state: persistedState.DelegationController,
    hashDelegation: getDelegationHashOffchain,
    getDelegationEnvironment,
  });

  controllerMessenger.registerActionHandler(
    'DelegationController:signDelegation',
    controller.signDelegation.bind(controller),
  );

  return {
    controller,
    api: {
      signDelegation: controller.signDelegation.bind(controller),
      storeDelegationEntry: controller.store.bind(controller),
      listDelegationEntries: controller.list.bind(controller),
      getDelegationEntry: controller.retrieve.bind(controller),
      getDelegationEntryChain: controller.chain.bind(controller),
      deleteDelegationEntry: controller.delete.bind(controller),
      awaitDeleteDelegationEntry: awaitDeleteDelegationEntry.bind(
        null,
        controller,
        initMessenger,
      ),
    },
  };
};

/**
 * Awaits for the transaction with txMeta to be confirmed, then
 * deletes the delegation entry with `hash`.
 *
 * @param controller - The DelegationController.
 * @param initMessenger - The initialization messenger for the controller.
 * @param options
 * @param options.hash - The hash of the delegation entry to delete.
 * @param options.txMeta - The transaction meta of the transaction that confirmed the delegation entry.
 * @param options.entryToStore - The delegation entry to store.
 */
export async function awaitDeleteDelegationEntry(
  controller: DelegationController,
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
      controller.delete(hash);
      if (entryToStore) {
        controller.store({ entry: entryToStore });
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
