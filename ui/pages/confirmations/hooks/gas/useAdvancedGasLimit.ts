import { useCallback, useMemo, useState } from 'react';
import { TransactionMeta } from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { omit } from 'lodash';

const GAS_FEE_FIELDS = [
  'gas',
  'gasPrice',
  'maxFeePerGas',
  'maxPriorityFeePerGas',
  'maxFeePerBlobGas',
];

type GasLimitState = {
  editableGasLimit: Hex | undefined;
  estimationFailed: boolean;
  hasCurrentEstimate: boolean;
  sourceGasLimit: Hex | undefined;
  transactionKey: string;
};

/**
 * Creates a key for the transaction fields that affect gas estimation.
 *
 * @param transactionMeta - The transaction displayed by the gas modal.
 * @returns A stable key for the transaction shape and network client.
 */
export function getAdvancedGasLimitTransactionKey(
  transactionMeta: TransactionMeta | undefined,
): string {
  return JSON.stringify({
    id: transactionMeta?.id,
    chainId: transactionMeta?.chainId,
    networkClientId: transactionMeta?.networkClientId,
    txParams: omit(transactionMeta?.txParams, GAS_FEE_FIELDS),
  });
}

/**
 * Provides the editable gas limit for an advanced gas modal while keeping it
 * tied to the transaction shape and network client that produced it.
 *
 * A transaction or network change invalidates an unchanged gas limit until the
 * transaction controller supplies a new estimate. Estimation failures also
 * invalidate the current value.
 *
 * @param transactionMeta - The transaction displayed by the gas modal.
 * @returns The current gas limit, its availability, and a setter for user edits.
 */
export function useAdvancedGasLimit(
  transactionMeta: TransactionMeta | undefined,
): {
  gasLimit: Hex | undefined;
  isGasLimitAvailable: boolean;
  setGasLimit: (gasLimit: Hex) => void;
  transactionKey: string;
} {
  const transactionGasLimit = transactionMeta?.txParams?.gas as Hex | undefined;
  const estimationFailed = Boolean(transactionMeta?.simulationFails);
  const transactionKey = useMemo(
    () => getAdvancedGasLimitTransactionKey(transactionMeta),
    [transactionMeta],
  );

  const [state, setState] = useState<GasLimitState>(() => ({
    editableGasLimit: estimationFailed ? undefined : transactionGasLimit,
    estimationFailed,
    hasCurrentEstimate: !estimationFailed && transactionGasLimit !== undefined,
    sourceGasLimit: transactionGasLimit,
    transactionKey,
  }));

  let currentState = state;
  const transactionChanged = state.transactionKey !== transactionKey;
  const estimateChanged = state.sourceGasLimit !== transactionGasLimit;
  const failureChanged = state.estimationFailed !== estimationFailed;

  if (transactionChanged || estimateChanged || failureChanged) {
    let { hasCurrentEstimate } = state;
    if (estimationFailed) {
      hasCurrentEstimate = false;
    } else if (transactionChanged) {
      hasCurrentEstimate = estimateChanged && transactionGasLimit !== undefined;
    } else if (estimateChanged) {
      hasCurrentEstimate = transactionGasLimit !== undefined;
    }

    currentState = {
      editableGasLimit: hasCurrentEstimate ? transactionGasLimit : undefined,
      estimationFailed,
      hasCurrentEstimate,
      sourceGasLimit: transactionGasLimit,
      transactionKey,
    };
    setState(currentState);
  }

  const setGasLimit = useCallback(
    (updatedGasLimit: Hex) => {
      if (!currentState.hasCurrentEstimate) {
        return;
      }
      setState({
        ...currentState,
        editableGasLimit: updatedGasLimit,
      });
    },
    [currentState],
  );

  return {
    gasLimit: currentState.editableGasLimit,
    isGasLimitAvailable:
      currentState.hasCurrentEstimate &&
      currentState.editableGasLimit !== undefined,
    setGasLimit,
    transactionKey,
  };
}
