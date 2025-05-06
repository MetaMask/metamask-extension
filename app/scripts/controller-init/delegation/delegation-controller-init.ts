import {
  DelegationController,
  DelegationControllerMessenger,
} from '@metamask/delegation-controller';
import { TransactionMeta } from '@metamask/transaction-controller';
import { type Hex } from '../../../../shared/lib/delegation/utils';
import {
  getDelegationHashOffchain,
  getDeleGatorEnvironment,
} from '../../../../shared/lib/delegation';
import { DelegationControllerInitMessenger } from '../messengers/delegation/delegation-controller-messenger';
import { ControllerInitFunction } from '../types';

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
 */
async function awaitDeleteDelegationEntry(
  controller: DelegationController,
  initMessenger: DelegationControllerInitMessenger,
  { hash, txMeta }: { hash: Hex; txMeta: TransactionMeta },
) {
  const handleTransactionConfirmed = (transactionMeta: TransactionMeta) => {
    if (
      transactionMeta.id === txMeta.id ||
      transactionMeta.replacedById === txMeta.replacedById
    ) {
      controller.delete(hash);
      initMessenger.unsubscribe(
        'TransactionController:transactionConfirmed',
        handleTransactionConfirmed,
      );
    }
  };
  initMessenger.subscribe(
    'TransactionController:transactionConfirmed',
    handleTransactionConfirmed,
  );
}
