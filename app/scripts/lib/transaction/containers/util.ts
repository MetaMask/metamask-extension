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
  const {
    chainId,
    id: transactionid,
    simulationData,
    txParamsOriginal,
  } = transactionMeta;
  const finalMetadata = cloneDeep(transactionMeta);

  if (txParamsOriginal) {
    finalMetadata.txParams = cloneDeep(txParamsOriginal);
  }

  if (types.includes(TransactionContainerType.EnforcedSimulations)) {
    const appControllerState = await messenger.call(
      'AppStateController:getState',
    );

    const slippage =
      appControllerState.enforcedSimulationsSlippageForTransactions[
        transactionid
      ] ?? appControllerState.enforcedSimulationsSlippage;

    const { updateTransaction } = await enforceSimulations({
      chainId,
      messenger,
      simulationData: simulationData ?? { tokenBalanceChanges: [] },
      slippage,
      txParams: finalMetadata.txParams,
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

    newGas = gas;
  }

  return {
    updateTransaction: (transaction: TransactionMeta) => {
      transaction.containerTypes = types;
      transaction.txParams = cloneDeep(finalMetadata.txParams);

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
    to: newTransactionMeta.txParams.to,
    value: newTransactionMeta.txParams.value,
  });
}
