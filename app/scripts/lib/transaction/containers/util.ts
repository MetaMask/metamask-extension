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
const DEBUG_LOG_PREFIX = '[enforced-simulations-debug]';

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

  const originalGas = finalMetadata.txParams.gas;
  const estimationParams = cloneDeep(finalMetadata.txParams);
  delete estimationParams.gas;
  delete estimationParams.gasLimit;

  const { gas, simulationFails } = isApproved
    ? await messenger.call(
        'TransactionController:estimateGas',
        estimationParams,
        finalMetadata.networkClientId,
      )
    : await messenger.call(
        'TransactionController:estimateGas',
        estimationParams,
        finalMetadata.networkClientId,
        {
          ignoreDelegationSignatures: true,
        },
      );

  log('Estimated gas', { gas, isApproved, simulationFails });

  const newGas = simulationFails
    ? (originalGas as Hex | undefined)
    : (gas as Hex);

  console.warn(
    DEBUG_LOG_PREFIX,
    'container-gas-estimated',
    JSON.stringify(
      {
        phase: isApproved ? 'approved' : 'preview',
        originalGas,
        returnedGas: gas,
        simulationFailure: simulationFails
          ? {
              reason: simulationFails.reason,
              errorKey: simulationFails.errorKey,
              debug: simulationFails.debug,
            }
          : undefined,
        fallbackDiscarded: Boolean(simulationFails),
        selectedGas: newGas,
        signedGasLimit: isApproved && !simulationFails ? newGas : undefined,
      },
      null,
      2,
    ),
  );

  if (isApproved && simulationFails) {
    throw new Error('Failed to estimate gas for transaction containers');
  }

  return {
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
