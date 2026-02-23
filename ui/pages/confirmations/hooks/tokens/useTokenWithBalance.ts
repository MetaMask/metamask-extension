import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { BigNumber } from 'bignumber.js';
import { getNativeTokenAddress } from '@metamask/assets-controllers';
import { toChecksumHexAddress } from '@metamask/controller-utils';
import type { Hex } from '@metamask/utils';
import { selectSingleTokenByAddressAndChainId } from '../../../../selectors/assets';
import { getSelectedInternalAccount } from '../../../../selectors/accounts';
import {
  getNativeTokenCachedBalanceByChainIdSelector,
  getNativeTokenInfo,
} from '../../../../selectors';
import { getTokenBalances } from '../../../../ducks/metamask/metamask';
import { getNetworkConfigurationsByChainId } from '../../../../../shared/modules/selectors/networks';
import { useFiatFormatter } from '../../../../hooks/useFiatFormatter';
import { useTokenFiatRate } from './useTokenFiatRates';

export type TokenWithBalance = {
  address: Hex;
  chainId: Hex;
  symbol: string;
  decimals: number;
  balance: string;
  balanceFiat: string;
  balanceRaw: string;
  tokenFiatAmount: number;
};

export function useTokenWithBalance(
  tokenAddress: Hex,
  chainId: Hex,
): TokenWithBalance | undefined {
  const fiatFormatter = useFiatFormatter();
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const selectedAddress = selectedAccount?.address as Hex | undefined;
  const networkConfigurationsByChainId = useSelector(
    getNetworkConfigurationsByChainId,
  );

  const nativeTokenInfo = getNativeTokenInfo(
    networkConfigurationsByChainId,
    chainId,
  );
  const ticker = nativeTokenInfo?.symbol ?? 'ETH';

  const token = useSelector((state) =>
    selectSingleTokenByAddressAndChainId(state, tokenAddress, chainId),
  );

  const nativeBalances = useSelector((state) =>
    selectedAddress
      ? (getNativeTokenCachedBalanceByChainIdSelector(
          state,
          selectedAddress,
        ) as Record<Hex, Hex>)
      : ({} as Record<Hex, Hex>),
  );
  const tokenBalances = useSelector(getTokenBalances) as Record<
    Hex,
    Record<Hex, Record<Hex, Hex>>
  >;

  const isNative =
    tokenAddress.toLowerCase() === getNativeTokenAddress(chainId).toLowerCase();

  const tokenBalanceHex = useMemo(() => {
    if (isNative) {
      return nativeBalances?.[chainId] ?? '0x0';
    }

    if (!selectedAddress) {
      return '0x0';
    }

    const tokenBalanceMap = tokenBalances?.[selectedAddress]?.[chainId];
    if (!tokenBalanceMap) {
      return '0x0';
    }

    return (
      tokenBalanceMap[toChecksumHexAddress(tokenAddress) as Hex] ??
      tokenBalanceMap[tokenAddress] ??
      '0x0'
    );
  }, [
    chainId,
    isNative,
    nativeBalances,
    selectedAddress,
    tokenAddress,
    tokenBalances,
  ]);

  const tokenFiatRate = useTokenFiatRate(tokenAddress, chainId, 'USD') ?? 0;

  return useMemo(() => {
    if (!token && !isNative) {
      return undefined;
    }

    const balanceRawValue = new BigNumber(
      tokenBalanceHex.replace(/^0x/u, '') || '0',
      16,
    );
    const balanceRaw = balanceRawValue.toString(10);
    const decimals = Number(token?.decimals ?? 18);
    const divisor = new BigNumber(10).pow(decimals);
    const balanceValue = balanceRawValue.dividedBy(divisor);
    const tokenFiatValue = balanceValue.times(tokenFiatRate.toString());
    const tokenFiatAmount = tokenFiatValue.toNumber();
    const symbol = token?.symbol ?? ticker;
    const balanceFiat = fiatFormatter(tokenFiatAmount);

    return {
      address: tokenAddress,
      chainId,
      symbol,
      decimals,
      balance: balanceValue.toString(10),
      balanceFiat,
      balanceRaw,
      tokenFiatAmount,
    };
  }, [
    chainId,
    fiatFormatter,
    isNative,
    ticker,
    token,
    tokenAddress,
    tokenBalanceHex,
    tokenFiatRate,
  ]);
}
