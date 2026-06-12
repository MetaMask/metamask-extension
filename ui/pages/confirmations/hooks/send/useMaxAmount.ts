import { CHAIN_IDS } from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { useCallback } from 'react';
import { DefaultRootState, useSelector } from 'react-redux';

import { Numeric } from '../../../../../shared/lib/Numeric';
import { getGasFeeEstimatesByChainId } from '../../../../ducks/metamask/metamask';
import { useAsyncResult } from '../../../../hooks/useAsync';
import { Asset } from '../../types/send';
import {
  fetchSuggestedMaxFeePerGas,
  getLayer1GasFees,
  sharesBalanceWithNativeGasToken,
  toTokenMinimalUnit,
} from '../../utils/send';
import { useSendContext } from '../../context/send';
import { useIsNetworkGasSponsored } from '../../../../hooks/useIsNetworkGasSponsored';
import { useBalance } from './useBalance';
import { useSendType } from './useSendType';

const NATIVE_TRANSFER_GAS_LIMIT = 21000;
const GWEI_TO_WEI_CONVERSION_RATE = 1e9;
const NATIVE_TOKEN_DECIMALS = 18;
// Arc's USDC send is an ERC20 transfer, which costs far more than a native
// transfer. Because the gas is held upfront (gasLimit * maxFeePerGas) from the
// same balance the transfer draws from, a conservative ERC20 transfer gas
// limit is reserved so the transfer never exceeds the balance.
const ARC_USDC_TRANSFER_GAS_LIMIT = 100000;

/**
 * Re-express a minimal-unit amount from one decimal precision to another.
 * Used to convert a native-denominated gas fee (18 decimals) into the send
 * token's minimal units before subtracting. A no-op when decimals match.
 *
 * @param value - The amount in `fromDecimals` minimal units.
 * @param fromDecimals - The decimals the value is currently expressed in.
 * @param toDecimals - The decimals to convert the value to.
 */
const scaleMinimalUnits = (
  value: Numeric,
  fromDecimals: number,
  toDecimals: number,
) => {
  if (fromDecimals === toDecimals) {
    return value;
  }
  const factor = Math.pow(10, Math.abs(fromDecimals - toDecimals));
  return fromDecimals > toDecimals
    ? value.divide(factor, 10)
    : value.times(factor, 10);
};

export type GasFeeEstimatesType = {
  medium: {
    suggestedMaxFeePerGas: number;
  };
};

export const getEstimatedTotalGas = (
  layer1GasFees: Hex,
  gasFeeEstimates?: GasFeeEstimatesType,
) => {
  if (!gasFeeEstimates) {
    return new Numeric('0', 10);
  }
  const { medium: { suggestedMaxFeePerGas } = { suggestedMaxFeePerGas: 0 } } =
    gasFeeEstimates;
  const totalGas = new Numeric(
    suggestedMaxFeePerGas * NATIVE_TRANSFER_GAS_LIMIT,
    10,
  );
  const conversionrate = new Numeric(GWEI_TO_WEI_CONVERSION_RATE, 10);
  return totalGas.times(conversionrate).add(new Numeric(layer1GasFees, 16));
};

/**
 * Arc-specific gas estimate. Identical to `getEstimatedTotalGas` but uses an
 * ERC20 transfer gas limit instead of the native transfer limit, since the Arc
 * USDC send is an ERC20 transfer whose gas is reserved upfront from the same
 * mirrored balance.
 *
 * @param layer1GasFees - The layer-1 gas fee in hex, when applicable.
 * @param gasFeeEstimates - The chain's gas fee estimates.
 */
const getArcEstimatedTotalGas = (
  layer1GasFees: Hex,
  gasFeeEstimates?: GasFeeEstimatesType,
) => {
  if (!gasFeeEstimates) {
    return new Numeric('0', 10);
  }
  const { medium: { suggestedMaxFeePerGas } = { suggestedMaxFeePerGas: 0 } } =
    gasFeeEstimates;
  const totalGas = new Numeric(
    suggestedMaxFeePerGas * ARC_USDC_TRANSFER_GAS_LIMIT,
    10,
  );
  const conversionrate = new Numeric(GWEI_TO_WEI_CONVERSION_RATE, 10);
  return totalGas.times(conversionrate).add(new Numeric(layer1GasFees, 16));
};

type GetMaxAmountArgs = {
  asset?: Asset;
  layer1GasFees: Hex;
  isEvmNativeSendType?: boolean;
  gasFeeEstimates?: GasFeeEstimatesType;
  rawBalanceNumeric: Numeric;
  isNetworkGasSponsored: boolean;
};

const getMaxAmountFn = ({
  asset,
  layer1GasFees,
  gasFeeEstimates,
  isEvmNativeSendType,
  rawBalanceNumeric,
  isNetworkGasSponsored,
}: GetMaxAmountArgs) => {
  if (!asset) {
    return '0';
  }

  let estimatedTotalGas = new Numeric('0', 10);

  if (isEvmNativeSendType && !isNetworkGasSponsored) {
    estimatedTotalGas = getEstimatedTotalGas(layer1GasFees, gasFeeEstimates);
  }

  const balance = rawBalanceNumeric.minus(estimatedTotalGas);

  return balance.isZero() || balance.isNegative()
    ? '0'
    : toTokenMinimalUnit(balance.toString(), asset.decimals, 10);
};

type GetArcMaxAmountArgs = {
  asset?: Asset;
  layer1GasFees: Hex;
  gasFeeEstimates?: GasFeeEstimatesType;
  rawBalanceNumeric: Numeric;
  isNetworkGasSponsored: boolean;
};

/**
 * Arc-specific max amount calculation (kept separate from the default flow).
 *
 * On Arc the native gas token and the displayed USDC ERC20 are the same
 * balance mirrored at two addresses with different decimals (native: 18,
 * USDC: 6). The send is a normal ERC20 transfer validated against the USDC
 * balance, but the gas it costs is drawn from that same balance, so the max
 * sendable amount must reserve the native gas fee — otherwise the transfer
 * reverts with "ERC20: transfer amount exceeds balance". The fee is priced in
 * 18-decimal native units, so it is normalized into the token's decimals
 * before subtracting to avoid mixing scales.
 *
 * @param args - The Arc max amount arguments.
 * @param args.asset - The Arc USDC asset being sent.
 * @param args.layer1GasFees - The layer-1 gas fee (hex), when applicable.
 * @param args.gasFeeEstimates - The chain's gas fee estimates.
 * @param args.rawBalanceNumeric - The USDC balance in minimal units.
 * @param args.isNetworkGasSponsored - Whether gas is sponsored on the network.
 */
const getArcMaxAmountFn = ({
  asset,
  layer1GasFees,
  gasFeeEstimates,
  rawBalanceNumeric,
  isNetworkGasSponsored,
}: GetArcMaxAmountArgs) => {
  if (!asset) {
    return '0';
  }

  const tokenDecimals = asset.decimals ?? NATIVE_TOKEN_DECIMALS;

  let gasInTokenUnits = new Numeric('0', 10);

  if (!isNetworkGasSponsored) {
    const estimatedTotalGas = getArcEstimatedTotalGas(
      layer1GasFees,
      gasFeeEstimates,
    );
    gasInTokenUnits = scaleMinimalUnits(
      estimatedTotalGas,
      NATIVE_TOKEN_DECIMALS,
      tokenDecimals,
    );
  }

  const balance = rawBalanceNumeric.minus(gasInTokenUnits);

  return balance.isZero() || balance.isNegative()
    ? '0'
    : toTokenMinimalUnit(balance.toString(), tokenDecimals, 10);
};

export const useMaxAmount = () => {
  const { asset, chainId, from, value } = useSendContext();
  const { isEvmSendType, isEvmNativeSendType } = useSendType();
  const { rawBalanceNumeric } = useBalance();
  const { isNetworkGasSponsored } = useIsNetworkGasSponsored(chainId);

  // On Arc the USDC ERC20 shares its balance with the native gas token, so the
  // max amount is routed through a dedicated Arc flow (see getArcMaxAmountFn)
  // instead of the default native/ERC20 calculation.
  const isArcNativeMirror = sharesBalanceWithNativeGasToken(chainId, asset);

  const gasFeeEstimates = useSelector((state) => {
    if (chainId && isEvmSendType) {
      return (
        getGasFeeEstimatesByChainId as (
          state: DefaultRootState,
          chainId: Hex,
        ) => GasFeeEstimatesType
      )(state, chainId as Hex);
    }
    return undefined;
  });

  // A single async result resolves both the layer-1 gas fee (default flow) and,
  // for Arc, the suggested fee fetched directly from the gas API (the gas-fee
  // controller may not be polling Arc into state during the send flow). Keeping
  // this as one async call avoids a second state update per render.
  const { value: gasData } = useAsyncResult(async () => {
    const layer1GasFees =
      !isEvmNativeSendType || asset?.chainId === CHAIN_IDS.MAINNET || !from
        ? '0x0'
        : await getLayer1GasFees({
            asset: asset as Asset,
            chainId: chainId as Hex,
            from: from as Hex,
            value: (value ?? '0') as string,
          });

    const arcSuggestedMaxFeePerGas =
      isArcNativeMirror && chainId
        ? await fetchSuggestedMaxFeePerGas(chainId)
        : undefined;

    return { layer1GasFees, arcSuggestedMaxFeePerGas };
  }, [asset, chainId, from, value, isArcNativeMirror, isEvmNativeSendType]);

  const layer1GasFees = gasData?.layer1GasFees;
  const arcSuggestedMaxFeePerGas = gasData?.arcSuggestedMaxFeePerGas;

  const getMaxAmount = useCallback(() => {
    if (isArcNativeMirror) {
      // Prefer the directly-fetched Arc fee, falling back to state estimates.
      const arcGasFeeEstimates: GasFeeEstimatesType | undefined =
        arcSuggestedMaxFeePerGas
          ? { medium: { suggestedMaxFeePerGas: arcSuggestedMaxFeePerGas } }
          : gasFeeEstimates;

      return getArcMaxAmountFn({
        asset,
        gasFeeEstimates: arcGasFeeEstimates,
        layer1GasFees: layer1GasFees ?? '0x0',
        rawBalanceNumeric,
        isNetworkGasSponsored,
      });
    }

    return getMaxAmountFn({
      asset,
      gasFeeEstimates,
      isEvmNativeSendType,
      layer1GasFees: layer1GasFees ?? '0x0',
      rawBalanceNumeric,
      isNetworkGasSponsored,
    });
  }, [
    asset,
    arcSuggestedMaxFeePerGas,
    gasFeeEstimates,
    isArcNativeMirror,
    isEvmNativeSendType,
    layer1GasFees,
    rawBalanceNumeric,
    isNetworkGasSponsored,
  ]);

  return {
    getMaxAmount,
  };
};
