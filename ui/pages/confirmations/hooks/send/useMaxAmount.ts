import { Hex } from '@metamask/utils';
import { getNativeTokenAddress } from '@metamask/assets-controllers';
import { isAddress as isEvmAddress } from 'ethers/lib/utils';
import { useCallback, useMemo } from 'react';
import { DefaultRootState, useSelector } from 'react-redux';

import { Numeric } from '../../../../../shared/modules/Numeric';
import {
  getGasFeeEstimatesByChainId,
  getTokenBalances,
} from '../../../../ducks/metamask/metamask';
import { Asset } from '../../types/send';
import { toTokenMinimalUnit } from '../../utils/send';
import { useSendContext } from '../../context/send';
import { useSendType } from './useSendType';

const NATIVE_TRANSFER_GAS_LIMIT = 21000;
const GWEI_TO_WEI_CONVERSION_RATE = 1e9;

export type GasFeeEstimatesType = {
  medium: {
    suggestedMaxFeePerGas: number;
  };
};

export const getEstimatedTotalGas = (gasFeeEstimates?: GasFeeEstimatesType) => {
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
  return totalGas.times(conversionrate);
};

type AccountWithBalances = Record<Hex, { balance: Hex }>;
type TokenBalances = Record<Hex, Record<Hex, Record<Hex, Hex>>>;
type MetamaskSendState = {
  metamask: { accountsByChainId: Record<Hex, AccountWithBalances> };
};
type GetEvmMaxAmountArgs = {
  accountsWithBalances?: AccountWithBalances;
  asset?: Asset;
  from: string;
  tokenBalances: TokenBalances;
  gasFeeEstimates?: GasFeeEstimatesType;
};

const getEvmMaxAmount = ({
  accountsWithBalances,
  asset,
  from,
  tokenBalances,
  gasFeeEstimates,
}: GetEvmMaxAmountArgs) => {
  if (!asset) {
    return '0';
  }
  const nativeTokenAddressForChainId = getNativeTokenAddress(
    asset.chainId as Hex,
  );
  if (
    nativeTokenAddressForChainId.toLowerCase() === asset.address?.toLowerCase()
  ) {
    if (!accountsWithBalances) {
      return '0';
    }
    const accountAddress = Object.keys(accountsWithBalances).find(
      (address) => address.toLowerCase() === from.toLowerCase(),
    ) as Hex;
    const account = accountsWithBalances[accountAddress];
    const estimatedTotalGas = getEstimatedTotalGas(gasFeeEstimates);
    const balance = new Numeric(account.balance, 16).minus(estimatedTotalGas);
    return balance.isZero() || balance.isNegative()
      ? '0'
      : toTokenMinimalUnit(balance.toBase(16).toString(), asset.decimals);
  }
  const tokenBalance = (
    Object.values(tokenBalances[from as Hex]).find(
      (chainTokenBalances: Record<Hex, Hex>) =>
        chainTokenBalances?.[asset?.address as Hex],
    ) as Record<Hex, Hex>
  )?.[asset?.address as Hex];

  return toTokenMinimalUnit(tokenBalance, asset.decimals);
};

const getNonEvmMaxAmount = (asset?: Asset) => {
  if (!asset) {
    return '0';
  }

  return asset.primary;
};

export const useMaxAmount = () => {
  const { asset, chainId, from } = useSendContext();
  const tokenBalances = useSelector(getTokenBalances);
  const { isEvmSendType } = useSendType();
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
  const accountsByChainId = useSelector(
    (state: MetamaskSendState) => state.metamask.accountsByChainId,
  ) as AccountWithBalances;
  const accountsWithBalances = useMemo(() => {
    if (chainId && asset?.address && isEvmAddress(asset?.address)) {
      return accountsByChainId[chainId as Hex];
    }
    return undefined;
  }, [accountsByChainId, asset?.address, chainId]);

  const getMaxAmount = useCallback(() => {
    if (isEvmSendType) {
      return getEvmMaxAmount({
        accountsWithBalances,
        asset,
        from,
        tokenBalances,
        gasFeeEstimates,
      });
    }
    return getNonEvmMaxAmount(asset);
  }, [
    accountsWithBalances,
    asset,
    from,
    gasFeeEstimates,
    isEvmSendType,
    tokenBalances,
  ]);

  return {
    getMaxAmount,
  };
};
