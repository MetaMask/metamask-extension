import { CHAIN_IDS } from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { useCallback } from 'react';
import { useAppSelector } from '../../../../store/hooks';
import { estimateGas } from '../../../../store/actions';

import { Numeric } from '../../../../../shared/lib/Numeric';
import { useAsyncResult } from '../../../../hooks/useAsync';
import { useGasFeeEstimates } from '../../../../hooks/useGasFeeEstimates';
import { Asset } from '../../types/send';
import {
  getLayer1GasFees,
  prepareEVMTransaction,
  toTokenMinimalUnit,
} from '../../utils/send';
import { useSendContext } from '../../context/send';
import { useIsNetworkGasSponsored } from '../../../../hooks/useIsNetworkGasSponsored';
import { useBalance } from './useBalance';
import { useSendType } from './useSendType';

const GWEI_TO_WEI_CONVERSION_RATE = 1e9;
const GAS_LIMIT_BUFFER_MULTIPLIER = 1.5;

type FeeMarketGasFeeEstimate = {
  medium: {
    maxFeePerGas?: string;
    suggestedMaxFeePerGas?: number | string;
  };
};

type LegacyGasFeeEstimate = {
  medium: string;
};

type GasPriceEstimate = {
  gasPrice: string;
};

type NoGasFeeEstimate = {
  gasPrice?: never;
  medium?: never;
};

export type GasFeeEstimatesType =
  | FeeMarketGasFeeEstimate
  | GasPriceEstimate
  | LegacyGasFeeEstimate
  | NoGasFeeEstimate;

const getMaxFeePerGasInWei = (gasFeeEstimates: GasFeeEstimatesType) => {
  if ('gasPrice' in gasFeeEstimates && gasFeeEstimates.gasPrice !== undefined) {
    return new Numeric(gasFeeEstimates.gasPrice, 10).times(
      new Numeric(GWEI_TO_WEI_CONVERSION_RATE, 10),
    );
  }

  if (!('medium' in gasFeeEstimates)) {
    return undefined;
  }

  const { medium } = gasFeeEstimates;
  if (medium === undefined) {
    return undefined;
  }

  if (typeof medium === 'string') {
    return new Numeric(medium, 10).times(
      new Numeric(GWEI_TO_WEI_CONVERSION_RATE, 10),
    );
  }

  const { maxFeePerGas, suggestedMaxFeePerGas } = medium;
  if (suggestedMaxFeePerGas !== undefined) {
    return new Numeric(suggestedMaxFeePerGas, 10).times(
      new Numeric(GWEI_TO_WEI_CONVERSION_RATE, 10),
    );
  }

  return maxFeePerGas === undefined ? undefined : new Numeric(maxFeePerGas, 16);
};

export const getEstimatedTotalGas = (
  gasLimit: Hex,
  layer1GasFees: Hex,
  gasFeeEstimates: GasFeeEstimatesType,
) => {
  const maxFeePerGasInWei = getMaxFeePerGasInWei(gasFeeEstimates);
  const gasFee = maxFeePerGasInWei
    ? maxFeePerGasInWei.times(new Numeric(gasLimit, 16))
    : new Numeric('0', 10);

  return gasFee.add(new Numeric(layer1GasFees, 16));
};

type GetMaxAmountArgs = {
  asset?: Asset;
  estimatedTotalGas?: Numeric;
  rawBalanceNumeric: Numeric;
};

const getMaxAmountFn = ({
  asset,
  estimatedTotalGas = new Numeric('0', 10),
  rawBalanceNumeric,
}: GetMaxAmountArgs) => {
  if (!asset) {
    return '0';
  }

  const balance = rawBalanceNumeric.minus(estimatedTotalGas);

  return balance.isZero() || balance.isNegative()
    ? '0'
    : toTokenMinimalUnit(balance.toString(), asset.decimals, 10);
};

export const useMaxAmount = () => {
  const { asset, chainId, from, hexData, toResolved } = useSendContext();
  const { isEvmSendType, isEvmNativeSendType } = useSendType();
  const { rawBalanceNumeric } = useBalance();
  const { isNetworkGasSponsored } = useIsNetworkGasSponsored(chainId);

  const networkClientId = useAppSelector((state) => {
    if (!chainId) {
      return undefined;
    }

    const networkConfiguration =
      state.metamask.networkConfigurationsByChainId[chainId as Hex];
    return networkConfiguration?.rpcEndpoints[
      networkConfiguration.defaultRpcEndpointIndex
    ]?.networkClientId;
  });

  const requiresGasReservation =
    Boolean(isEvmNativeSendType) && !isNetworkGasSponsored;
  const { gasFeeEstimates } = useGasFeeEstimates(
    networkClientId,
    Boolean(isEvmSendType) &&
      requiresGasReservation &&
      Boolean(networkClientId),
  ) as { gasFeeEstimates?: GasFeeEstimatesType };
  const hasGasFeeEstimate =
    !requiresGasReservation ||
    Boolean(gasFeeEstimates && getMaxFeePerGasInWei(gasFeeEstimates));
  const hasGasEstimateInputs = Boolean(
    asset &&
    chainId &&
    from &&
    toResolved &&
    networkClientId &&
    hasGasFeeEstimate,
  );

  const gasEstimateResult = useAsyncResult(async () => {
    if (
      !requiresGasReservation ||
      !asset ||
      !chainId ||
      !from ||
      !toResolved ||
      !networkClientId ||
      !gasFeeEstimates ||
      !hasGasFeeEstimate
    ) {
      return undefined;
    }

    const estimateTransaction = async (estimateValue: string) => {
      const transactionParams = prepareEVMTransaction(
        asset,
        {
          from,
          to: toResolved,
          value: estimateValue,
        },
        hexData,
      );

      const [gasLimit, layer1GasFees] = await Promise.all([
        estimateGas(
          transactionParams,
          networkClientId,
          GAS_LIMIT_BUFFER_MULTIPLIER,
        ),
        chainId === CHAIN_IDS.MAINNET
          ? Promise.resolve('0x0' as Hex)
          : getLayer1GasFees({
              asset,
              chainId: chainId as Hex,
              from: from as Hex,
              value: estimateValue,
            }),
      ]);

      return {
        gasLimit,
        layer1GasFees: layer1GasFees ?? ('0x0' as Hex),
      };
    };

    // Bootstrap below the full balance so the node can reserve gas while using
    // a representative value for payable contracts, then re-estimate using the
    // resulting Max value.
    const bootstrapValue = toTokenMinimalUnit(
      rawBalanceNumeric.times(new Numeric('0.9', 10)).toString(),
      asset.decimals,
      10,
    ) as string;
    const initialEstimate = await estimateTransaction(bootstrapValue);
    const initialMaxAmount = getMaxAmountFn({
      asset,
      estimatedTotalGas: getEstimatedTotalGas(
        initialEstimate.gasLimit,
        initialEstimate.layer1GasFees,
        gasFeeEstimates,
      ),
      rawBalanceNumeric,
    }) as string;

    return new Numeric(initialMaxAmount, 10).isZero()
      ? initialEstimate
      : await estimateTransaction(initialMaxAmount);
  }, [
    asset,
    chainId,
    from,
    hexData,
    gasFeeEstimates,
    hasGasFeeEstimate,
    networkClientId,
    rawBalanceNumeric,
    requiresGasReservation,
    toResolved,
  ]);

  const isMaxAmountPending =
    requiresGasReservation && hasGasEstimateInputs && gasEstimateResult.pending;
  const isMaxAmountAvailable =
    !requiresGasReservation ||
    Boolean(
      hasGasEstimateInputs &&
      gasFeeEstimates &&
      gasEstimateResult.status === 'success' &&
      gasEstimateResult.value,
    );

  const getMaxAmount = useCallback(() => {
    if (!isMaxAmountAvailable) {
      return undefined;
    }

    const estimatedTotalGas =
      requiresGasReservation &&
      gasFeeEstimates &&
      gasEstimateResult.status === 'success' &&
      gasEstimateResult.value
        ? getEstimatedTotalGas(
            gasEstimateResult.value.gasLimit,
            gasEstimateResult.value.layer1GasFees,
            gasFeeEstimates,
          )
        : undefined;

    return getMaxAmountFn({
      asset,
      estimatedTotalGas,
      rawBalanceNumeric,
    });
  }, [
    asset,
    gasEstimateResult,
    gasFeeEstimates,
    isMaxAmountAvailable,
    rawBalanceNumeric,
    requiresGasReservation,
  ]);

  return {
    getMaxAmount,
    isMaxAmountAvailable,
    isMaxAmountPending,
  };
};
