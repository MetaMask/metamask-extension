import type { SingleChainGasFeeState } from '@metamask/gas-fee-controller';
import { CHAIN_IDS } from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { useCallback } from 'react';
import { useAppSelector } from '../../../../store/hooks';
import { estimateGas } from '../../../../store/actions';

import { Numeric } from '../../../../../shared/lib/Numeric';
import { selectDefaultNetworkClientIdsByChainId } from '../../../../../shared/lib/selectors/networks';
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

type GasFeeEstimates = SingleChainGasFeeState['gasFeeEstimates'];

const gweiToWei = (gwei: string) =>
  new Numeric(gwei, 10).times(new Numeric(GWEI_TO_WEI_CONVERSION_RATE, 10));

const getMaxFeePerGasInWei = (gasFeeEstimates: GasFeeEstimates) => {
  if ('gasPrice' in gasFeeEstimates) {
    return gweiToWei(gasFeeEstimates.gasPrice);
  }

  if (!('medium' in gasFeeEstimates)) {
    return undefined;
  }

  const { medium } = gasFeeEstimates;
  return gweiToWei(
    typeof medium === 'string' ? medium : medium.suggestedMaxFeePerGas,
  );
};

export const getEstimatedTotalGas = (
  gasLimit: Hex,
  layer1GasFees: Hex,
  gasFeeEstimates: GasFeeEstimates,
) => {
  const maxFeePerGasInWei = getMaxFeePerGasInWei(gasFeeEstimates);
  const gasFee = maxFeePerGasInWei
    ? maxFeePerGasInWei.times(new Numeric(gasLimit, 16))
    : new Numeric('0', 10);

  return gasFee.add(new Numeric(layer1GasFees, 16));
};

/**
 * Estimates the gas limit and layer 1 fee for sending the full native balance.
 *
 * `eth_estimateGas` without fee fields only requires the value to be covered
 * by the balance, so the transaction is estimated using the full balance and
 * the resulting gas cost is subtracted from it.
 *
 * @param args - The estimate arguments.
 * @param args.asset - The native asset being sent.
 * @param args.chainId - The chain ID of the send.
 * @param args.from - The sender address.
 * @param args.hexData - The optional transaction data.
 * @param args.networkClientId - The network client to estimate with.
 * @param args.rawBalanceNumeric - The raw native balance of the sender.
 * @param args.to - The recipient address.
 * @returns The estimated gas limit and layer 1 gas fees.
 */
const estimateMaxTransactionGas = async ({
  asset,
  chainId,
  from,
  hexData,
  networkClientId,
  rawBalanceNumeric,
  to,
}: {
  asset: Asset;
  chainId: Hex;
  from: Hex;
  hexData?: Hex;
  networkClientId: string;
  rawBalanceNumeric: Numeric;
  to: string;
}) => {
  const value = toTokenMinimalUnit(
    rawBalanceNumeric.toString(),
    asset.decimals,
    10,
  ) as string;
  const transactionParams = prepareEVMTransaction(
    asset,
    { from, to, value },
    hexData,
  );

  const [gasLimit, layer1GasFees] = await Promise.all([
    estimateGas(transactionParams, networkClientId),
    chainId === CHAIN_IDS.MAINNET
      ? Promise.resolve('0x0' as Hex)
      : getLayer1GasFees({ asset, chainId, from, value }),
  ]);

  return {
    gasLimit,
    layer1GasFees: layer1GasFees ?? ('0x0' as Hex),
  };
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

  const networkClientId = useAppSelector((state) =>
    chainId
      ? selectDefaultNetworkClientIdsByChainId(state)[chainId as Hex]
      : undefined,
  );

  const requiresGasReservation =
    Boolean(isEvmNativeSendType) && !isNetworkGasSponsored;
  const { gasFeeEstimates } = useGasFeeEstimates(
    networkClientId,
    Boolean(isEvmSendType) &&
      requiresGasReservation &&
      Boolean(networkClientId),
  ) as { gasFeeEstimates?: GasFeeEstimates };
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

    return await estimateMaxTransactionGas({
      asset,
      chainId: chainId as Hex,
      from: from as Hex,
      hexData,
      networkClientId,
      rawBalanceNumeric,
      to: toResolved,
    });
  }, [
    asset,
    chainId,
    from,
    hexData,
    hasGasFeeEstimate,
    networkClientId,
    rawBalanceNumeric,
    requiresGasReservation,
    toResolved,
  ]);

  const isMaxAmountPending =
    requiresGasReservation && hasGasEstimateInputs && gasEstimateResult.pending;
  const isMaxAmountError =
    requiresGasReservation &&
    hasGasEstimateInputs &&
    gasEstimateResult.status === 'error';
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
    isMaxAmountError,
    isMaxAmountPending,
  };
};
