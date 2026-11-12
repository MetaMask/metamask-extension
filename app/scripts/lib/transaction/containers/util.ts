import {
  TransactionContainerType,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { cloneDeep } from 'lodash';
import { createProjectLogger } from '@metamask/utils';
import type { Hex } from 'viem';
import { TransactionControllerInitMessenger } from '../../../wallet-init/messengers/transaction-controller-messenger';
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
  enforcedSimulationsSlippage?: number;
  updateTransaction: (transaction: TransactionMeta) => void;
}> {
  const { txParamsOriginal } = transactionMeta;
  const hasEnforcedSimulations = types.includes(
    TransactionContainerType.EnforcedSimulations,
  );
  const finalMetadata = cloneDeep(transactionMeta);
  let enforcedSimulationsSlippage: number | undefined;

  if (txParamsOriginal) {
    finalMetadata.txParams = cloneDeep(txParamsOriginal);
  }

  if (hasEnforcedSimulations) {
    const { slippage, updateTransaction } = await enforceSimulations({
      messenger,
      transactionMeta: finalMetadata,
      useRealSignature: isApproved,
    });

    enforcedSimulationsSlippage = slippage;
    updateTransaction(finalMetadata);
  }

  const originalGas = finalMetadata.txParams.gas as Hex | undefined;

  // Without containers the restored parameters are the original transaction,
  // so keep its gas (dapp-provided or buffered by the controller) instead of
  // replacing it with an unbuffered re-estimate.
  const newGas = hasEnforcedSimulations
    ? await estimateContainerGas({
        isApproved,
        messenger,
        originalGas,
        transactionMeta: finalMetadata,
      })
    : originalGas;

  return {
    enforcedSimulationsSlippage,
    updateTransaction: (transaction: TransactionMeta) => {
      transaction.containerTypes = types;

      // Only update the fields modified by container wrapping.
      // Preserves gas fees, nonce, chainId,
      // and other fields set by the approval flow.
      transaction.txParams.data = finalMetadata.txParams.data;
      transaction.txParams.to = finalMetadata.txParams.to;
      transaction.txParams.value = finalMetadata.txParams.value;

      if (finalMetadata.txParams.type) {
        transaction.txParams.type = finalMetadata.txParams.type;
      }

      if (finalMetadata.txParams.authorizationList) {
        transaction.txParams.authorizationList =
          finalMetadata.txParams.authorizationList;
      }

      if (newGas) {
        transaction.txParams.gas = newGas;

        if (isApproved) {
          transaction.txParams.gasLimit = newGas;
        }
      }
    },
  };
}

async function estimateContainerGas({
  isApproved,
  messenger,
  originalGas,
  transactionMeta,
}: {
  isApproved: boolean;
  messenger: TransactionControllerInitMessenger;
  originalGas: Hex | undefined;
  transactionMeta: TransactionMeta;
}): Promise<Hex | undefined> {
  const estimationParams = cloneDeep(transactionMeta.txParams);
  delete estimationParams.gas;
  delete estimationParams.gasLimit;

  const { gas, simulationFails } = isApproved
    ? await messenger.call(
        'TransactionController:estimateGas',
        estimationParams,
        transactionMeta.networkClientId,
      )
    : await messenger.call(
        'TransactionController:estimateGas',
        estimationParams,
        transactionMeta.networkClientId,
        {
          ignoreDelegationSignatures: true,
        },
      );

  log('Estimated gas', gas);

  if (!simulationFails) {
    return gas as Hex;
  }

  if (!isApproved) {
    throw new Error(
      `Failed to estimate gas for transaction containers: ${simulationFails.reason}`,
    );
  }

  return originalGas;
}
