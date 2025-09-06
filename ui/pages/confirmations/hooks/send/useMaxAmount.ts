import { CHAIN_IDS } from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { getNativeTokenAddress } from '@metamask/assets-controllers';
import { useCallback } from 'react';
import { DefaultRootState, useSelector } from 'react-redux';

import { Numeric } from '../../../../../shared/modules/Numeric';
import { getGasFeeEstimatesByChainId } from '../../../../ducks/metamask/metamask';
import { useAsyncResult } from '../../../../hooks/useAsync';
import { Asset } from '../../types/send';
import { getLayer1GasFees, toTokenMinimalUnit } from '../../utils/send';
import { useSendContext } from '../../context/send';
import { useBalance } from './useBalance';
import { useSendType } from './useSendType';

const NATIVE_TRANSFER_GAS_LIMIT = 21000;
const GWEI_TO_WEI_CONVERSION_RATE = 1e9;

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
  const {
    medium: { suggestedMaxFeePerGas },
  } = gasFeeEstimates;
  const totalGas = new Numeric(
    suggestedMaxFeePerGas * NATIVE_TRANSFER_GAS_LIMIT,
    10,
  );
  const conversionrate = new Numeric(GWEI_TO_WEI_CONVERSION_RATE, 10);
  return totalGas.times(conversionrate).add(new Numeric(layer1GasFees, 16));
};

type GetMaxAmountArgs = {
  asset?: Asset;
  layer1GasFees: Hex;
  isEvmSendType?: boolean;
  gasFeeEstimates?: GasFeeEstimatesType;
  rawBalanceNumeric: Numeric;
};

const getMaxAmountFn = ({
  asset,
  layer1GasFees,
  gasFeeEstimates,
  isEvmSendType,
  rawBalanceNumeric,
}: GetMaxAmountArgs) => {
  if (!asset) {
    return '0';
  }

  let estimatedTotalGas = new Numeric('0', 10);
  if (isEvmSendType) {
    const nativeTokenAddressForChainId = getNativeTokenAddress(
      asset.chainId as Hex,
    );
    if (
      nativeTokenAddressForChainId.toLowerCase() ===
      asset.address?.toLowerCase()
    ) {
      estimatedTotalGas = getEstimatedTotalGas(layer1GasFees, gasFeeEstimates);
    }
  }

  const balance = rawBalanceNumeric.minus(estimatedTotalGas);

  return balance.isZero() || balance.isNegative()
    ? '0'
    : toTokenMinimalUnit(balance.toString(), asset.decimals, 10);
};

export const useMaxAmount = () => {
  const { asset, chainId, from, value } = useSendContext();
  const { isEvmSendType, isEvmNativeSendType } = useSendType();
  const { rawBalanceNumeric } = useBalance();

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

  const { value: layer1GasFees } = useAsyncResult(async () => {
    if (!isEvmNativeSendType || asset?.chainId === CHAIN_IDS.MAINNET || !from) {
      return '0x0';
    }
    return await getLayer1GasFees({
      asset: asset as Asset,
      chainId: chainId as Hex,
      from: from as Hex,
      value: (value ?? '0') as string,
    });
  }, [asset, chainId, from, value]);

  const getMaxAmount = useCallback(() => {
    return getMaxAmountFn({
      asset,
      gasFeeEstimates,
      isEvmSendType,
      layer1GasFees: layer1GasFees ?? '0x0',
      rawBalanceNumeric,
    });
  }, [asset, gasFeeEstimates, isEvmSendType, layer1GasFees, rawBalanceNumeric]);

  return {
    getMaxAmount,
  };
};
