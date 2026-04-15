import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import {
  TransactionMeta,
  CANCEL_RATE,
  SPEED_UP_RATE,
} from '@metamask/transaction-controller';
import {
  EthGasPriceEstimate,
  GasFeeEstimates,
  LegacyGasPriceEstimate,
} from '@metamask/gas-fee-controller';
import { BigNumber } from 'bignumber.js';
import { addHexPrefix } from 'ethereumjs-util';
import { Hex } from '@metamask/utils';
import { PriorityLevels } from '../../../../shared/constants/gas';
import { Numeric } from '../../../../shared/lib/Numeric';
import { addTenPercentAndRound } from '../../../helpers/utils/gas';
import {
  createCancelTransaction,
  createSpeedUpTransaction,
  updateTransactionGasFees,
} from '../../../store/actions';
import { decGWEIToHexWEI } from '../../../../shared/lib/conversion.utils';

type GasFeeEstimatesUnion =
  | EthGasPriceEstimate
  | GasFeeEstimates
  | LegacyGasPriceEstimate
  | Record<string, never>;

type UseLegacyCancelSpeedupFlowParams = {
  transaction: TransactionMeta;
  gasFeeEstimates?: GasFeeEstimatesUnion;
};

type UseLegacyCancelSpeedupFlowReturn = {
  cancelTransaction: () => unknown;
  speedUpTransaction: () => unknown;
  updateTransactionToTenPercentIncreasedGasFee: (
    initTransaction?: boolean,
  ) => void;
  updateTransactionUsingEstimate: (gasFeeEstimateToUse: string) => void;
};

/**
 * Returns the higher of currentGasPrice or (previousGasPrice * rate),
 * ensuring replacement transactions are not underpriced.
 * @param currentGasPrice
 * @param previousGasPrice
 * @param rate
 */
function getReplacementGasPrice(
  currentGasPrice: string | undefined,
  previousGasPrice: string | undefined,
  rate: number,
): Hex {
  if (!previousGasPrice) {
    return (currentGasPrice ?? '0x0') as Hex;
  }

  const minGasPrice = new Numeric(previousGasPrice, 16)
    .times(new Numeric(rate, 10))
    .round(0)
    .toPrefixedHexString();

  const hexForBN = (v: string | undefined) =>
    v === null || v === undefined
      ? new BigNumber(0)
      : new BigNumber(addHexPrefix(String(v)));

  return (
    hexForBN(currentGasPrice).gte(new BigNumber(minGasPrice))
      ? currentGasPrice
      : minGasPrice
  ) as Hex;
}

/**
 * Self-contained hook for legacy (gasPrice-based) cancel/speedup transactions. Calls
 * updateTransactionGasFees and createCancelTransaction/createSpeedUpTransaction directly,
 * with no dependency on useTransactionFunctions.
 * @param options
 * @param options.transaction
 * @param options.gasFeeEstimates
 */
export function useLegacyCancelSpeedupFlow({
  transaction,
  gasFeeEstimates,
}: UseLegacyCancelSpeedupFlowParams): UseLegacyCancelSpeedupFlowReturn {
  const dispatch = useDispatch();

  const cancelTransaction = useCallback(() => {
    const gasPrice = getReplacementGasPrice(
      transaction.txParams?.gasPrice as string | undefined,
      (transaction.previousGas as Record<string, string> | undefined)?.gasPrice,
      CANCEL_RATE,
    );
    const gasLimit =
      transaction.txParams?.gas ?? transaction.txParams?.gasLimit;
    return dispatch(
      createCancelTransaction(transaction.id, {
        gasPrice,
        gas: gasLimit as string,
      }),
    );
  }, [dispatch, transaction]);

  const speedUpTransaction = useCallback(() => {
    const gasPrice = getReplacementGasPrice(
      transaction.txParams?.gasPrice as string | undefined,
      (transaction.previousGas as Record<string, string> | undefined)?.gasPrice,
      SPEED_UP_RATE,
    );
    const gasLimit =
      transaction.txParams?.gas ?? transaction.txParams?.gasLimit;
    return dispatch(
      createSpeedUpTransaction(transaction.id, {
        gasPrice,
        gas: gasLimit as string,
      }),
    );
  }, [dispatch, transaction]);

  const updateTransactionToTenPercentIncreasedGasFee = useCallback(
    (_initTransaction = false) => {
      const source = transaction.previousGas ?? transaction.txParams;
      const currentGasPrice = (source as Record<string, string>)?.gasPrice;
      if (!currentGasPrice) {
        return;
      }

      const bumpedGasPrice = addTenPercentAndRound(currentGasPrice);
      const gasLimit =
        (source as Record<string, string>)?.gas ??
        (source as Record<string, string>)?.gasLimit ??
        transaction.txParams?.gas ??
        transaction.txParams?.gasLimit;

      dispatch(
        updateTransactionGasFees(transaction.id, {
          gasPrice: bumpedGasPrice,
          gas: gasLimit,
          gasLimit,
          userFeeLevel: PriorityLevels.tenPercentIncreased,
        }),
      );
    },
    [dispatch, transaction],
  );

  const updateTransactionUsingEstimate = useCallback(
    (gasFeeEstimateToUse: string) => {
      if (!gasFeeEstimates) {
        return;
      }

      const estimates = gasFeeEstimates as Record<string, unknown>;
      let estimateGasPrice: string | undefined;

      // GasFeeEstimateType.GasPrice -- single gasPrice field
      if ('gasPrice' in estimates && typeof estimates.gasPrice === 'string') {
        estimateGasPrice = estimates.gasPrice;
      }

      // GasFeeEstimateType.Legacy -- gasPrice per level (low/medium/high are hex strings)
      const levelEstimate = estimates[gasFeeEstimateToUse];
      if (typeof levelEstimate === 'string') {
        estimateGasPrice = levelEstimate;
      }

      // FeeMarket estimates with suggestedMaxFeePerGas (fallback)
      if (
        !estimateGasPrice &&
        levelEstimate &&
        typeof levelEstimate === 'object' &&
        'suggestedMaxFeePerGas' in (levelEstimate as Record<string, unknown>)
      ) {
        estimateGasPrice = (levelEstimate as Record<string, string>)
          .suggestedMaxFeePerGas;
      }

      if (!estimateGasPrice) {
        return;
      }

      dispatch(
        updateTransactionGasFees(transaction.id, {
          gasPrice: decGWEIToHexWEI(estimateGasPrice) as string,
          userFeeLevel: gasFeeEstimateToUse,
        }),
      );
    },
    [dispatch, gasFeeEstimates, transaction.id],
  );

  return {
    cancelTransaction,
    speedUpTransaction,
    updateTransactionToTenPercentIncreasedGasFee,
    updateTransactionUsingEstimate,
  };
}
