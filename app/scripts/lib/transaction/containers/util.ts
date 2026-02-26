import {
  TransactionContainerType,
  TransactionController,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { cloneDeep } from 'lodash';
import { createProjectLogger } from '@metamask/utils';
import type { Hex } from 'viem';
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
  const { txParamsOriginal } = transactionMeta;
  const finalMetadata = cloneDeep(transactionMeta);

  if (txParamsOriginal) {
    finalMetadata.txParams = cloneDeep(txParamsOriginal);
  }

  if (types.includes(TransactionContainerType.EnforcedSimulations)) {
    const { updateTransaction } = await enforceSimulations({
      messenger,
      transactionMeta: finalMetadata,
      useRealSignature: isApproved,
    });

    updateTransaction(finalMetadata);
  }

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

    newGas = gas as Hex;
  }

  return {
    updateTransaction: (transaction: TransactionMeta) => {
      const { gasPrice, maxFeePerGas, maxPriorityFeePerGas } =
        transaction.txParams;

      transaction.containerTypes = types;
      transaction.txParams = cloneDeep(finalMetadata.txParams);

      // Preserve gas fee parameters set by the gas fee poller, since
      // finalMetadata.txParams is based on txParamsOriginal which may not
      // have them.
      if (gasPrice) {
        transaction.txParams.gasPrice = gasPrice;
      }

      if (maxFeePerGas) {
        transaction.txParams.maxFeePerGas = maxFeePerGas;
      }

      if (maxPriorityFeePerGas) {
        transaction.txParams.maxPriorityFeePerGas = maxPriorityFeePerGas;
      }

      if (newGas) {
        transaction.txParams.gas = newGas;
      }
    },
  };
}

export async function applyTransactionContainersExisting({
  containerTypes,
  transactionId,
  messenger,
  updateEditableParams,
}: {
  containerTypes: TransactionContainerType[];
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

  const { updateTransaction } = await applyTransactionContainers({
    isApproved: false,
    messenger,
    transactionMeta,
    types: containerTypes,
  });

  const newTransactionMeta = cloneDeep(transactionMeta);

  updateTransaction(newTransactionMeta);

  updateEditableParams(transactionId, {
    containerTypes,
    data: newTransactionMeta.txParams.data,
    gas: newTransactionMeta.txParams.gas,
    gasPrice: transactionMeta.txParams.gasPrice,
    maxFeePerGas: transactionMeta.txParams.maxFeePerGas,
    maxPriorityFeePerGas: transactionMeta.txParams.maxPriorityFeePerGas,
    to: newTransactionMeta.txParams.to,
    value: newTransactionMeta.txParams.value,
  });
}
