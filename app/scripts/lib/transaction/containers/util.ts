import {
  TransactionContainerType,
  TransactionController,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { cloneDeep } from 'lodash';
import { createProjectLogger } from '@metamask/utils';
import { Hex } from 'viem';
import { TransactionControllerInitMessenger } from '../../../controller-init/messengers/transaction-controller-messenger';
import { enforceSimulations } from './enforced-simulations';

const log = createProjectLogger('transaction-containers');

export async function applyTransactionContainers({
  isApproved,
  messenger,
  transactionMeta,
  types,
}: {
  isApproved: boolean;
  messenger: TransactionControllerInitMessenger;
  transactionMeta: TransactionMeta;
  types: TransactionContainerType[];
}): Promise<{
  updateTransaction: (transaction: TransactionMeta) => void;
}> {
  const { chainId, simulationData, txParams, txParamsOriginal } =
    transactionMeta;

  const params = txParamsOriginal ?? txParams;
  const updateTransactions: ((transaction: TransactionMeta) => void)[] = [];

  if (types.includes(TransactionContainerType.EnforcedSimulations)) {
    const { updateTransaction } = await enforceSimulations({
      chainId,
      messenger,
      simulationData: simulationData ?? { tokenBalanceChanges: [] },
      txParams: params,
      useRealSignature: isApproved,
    });

    updateTransactions.push(updateTransaction);
  }

  const updateTransaction = (transaction: TransactionMeta) => {
    updateTransactions.forEach((update) => {
      update(transaction);
    });
  };

  const finalMetadata = cloneDeep(transactionMeta);
  updateTransaction(finalMetadata);

  let newGas: Hex | undefined;

  if (!isApproved) {
    const { gas } = await messenger.call(
      'TransactionController:estimateGas',
      finalMetadata.txParams,
      finalMetadata.networkClientId,
      {
        ignoreDelegationSignatures: true,
      },
    );

    log('Estimated gas', gas);

    newGas = gas;
  }

  return {
    updateTransaction: (transaction: TransactionMeta) => {
      updateTransaction(transaction);

      transaction.containerTypes = types;

      if (newGas) {
        transaction.txParams.gas = newGas;
      }
    },
  };
}

export async function applyTransactionContainersExisting({
  transactionId,
  messenger,
  updateEditableParams,
}: {
  transactionId: string;
  messenger: TransactionControllerInitMessenger;
  updateEditableParams: TransactionController['updateEditableParams'];
}) {
  const transactionControllerState = await messenger.call(
    'TransactionController:getState',
  );

  const transactionMeta = transactionControllerState.transactions.find(
    (tx) => tx.id === transactionId,
  );

  if (!transactionMeta) {
    throw new Error(`Transaction with ID ${transactionId} not found.`);
  }

  const { containerTypes = [] } = transactionMeta;

  const newContainerTypes = [
    ...containerTypes,
    TransactionContainerType.EnforcedSimulations,
  ];

  const { updateTransaction } = await applyTransactionContainers({
    isApproved: false,
    messenger,
    transactionMeta,
    types: newContainerTypes,
  });

  const newTransactionMeta = cloneDeep(transactionMeta);

  updateTransaction(newTransactionMeta);

  updateEditableParams(transactionId, {
    containerTypes: newContainerTypes,
    data: newTransactionMeta.txParams.data,
    gas: newTransactionMeta.txParams.gas,
    to: newTransactionMeta.txParams.to,
    value: newTransactionMeta.txParams.value,
  });
}
