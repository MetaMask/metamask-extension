import { type Hex, type CaipChainId } from '@metamask/utils';
import { useCallback, useMemo } from 'react';
import {
  isSolanaChainId,
  calcLatestSrcBalance,
  formatChainIdToCaip,
  formatChainIdToHex,
  ChainId,
  isNativeAddress,
} from '@metamask/bridge-controller';
import { useLocation } from 'react-router-dom';
import { getSelectedInternalAccount } from '../../selectors';
import { useAsyncResult } from '../useAsync';
import { Numeric } from '../../../shared/modules/Numeric';
import { calcTokenAmount } from '../../../shared/lib/transactions-controller-utils';
import { useMultichainSelector } from '../useMultichainSelector';
import {
  getMultichainBalances,
  getMultichainCurrentChainId,
} from '../../selectors/multichain';
import { MULTICHAIN_NATIVE_CURRENCY_TO_CAIP19 } from '../../../shared/constants/multichain/assets';

/**
 * Custom hook to fetch and format the latest balance of a given token or native asset.
 *
 * @param token - The token object for which the balance is to be fetched. Can be null.
 * @returns An object containing the balanceAmount as a string.
 */
const useLatestBalance = (
  token: {
    address: string;
    decimals: number;
    symbol: string;
    string?: string;
    chainId: Hex | CaipChainId | ChainId;
    assetId?: string;
  } | null,
) => {
  const { search } = useLocation();

  const searchParams = useMemo(() => new URLSearchParams(search), [search]);
  const tokenAddressFromUrl = useMemo(
    () => searchParams.get('token'),
    [searchParams],
  );

  const { address: selectedAddress, id } = useMultichainSelector(
    getSelectedInternalAccount,
  );
  const currentChainId = useMultichainSelector(getMultichainCurrentChainId);

  const nonEvmBalancesByAccountId = useMultichainSelector(
    getMultichainBalances,
  );

  const nonEvmBalances = useMemo(
    () => nonEvmBalancesByAccountId?.[id],
    [nonEvmBalancesByAccountId, id],
  );

  // Don't fetch the balance the src token balance until the tokenAddressFromUrl is unset
  const shouldUpdateBalance = useCallback(
    () => token?.chainId && !tokenAddressFromUrl,
    [tokenAddressFromUrl, token],
  );

  const value = useAsyncResult<string | undefined>(async () => {
    if (!shouldUpdateBalance() || !token) {
      return undefined;
    }

    const { chainId } = token;
    // No need to fetch the balance for non-EVM tokens
    if (isSolanaChainId(chainId)) {
      return undefined;
    }

    if (
      token.address &&
      formatChainIdToCaip(currentChainId) === formatChainIdToCaip(chainId)
    ) {
      return (
        await calcLatestSrcBalance(
          global.ethereumProvider,
          selectedAddress,
          token.address,
          formatChainIdToHex(chainId),
        )
      )?.toString();
    }

    return undefined;
  }, [
    currentChainId,
    token,
    selectedAddress,
    tokenAddressFromUrl,
    shouldUpdateBalance,
  ]);

  const nonEvmBalance = useMemo(() => {
    if (!shouldUpdateBalance() || !token) {
      return undefined;
    }

    const { chainId, decimals, address } = token;

    // Use the balance provided by the multichain balances controller
    if (isSolanaChainId(chainId) && decimals) {
      const caipAssetType = isNativeAddress(address)
        ? MULTICHAIN_NATIVE_CURRENCY_TO_CAIP19.SOL
        : token.assetId ?? token.address;
      return Numeric.from(
        nonEvmBalances?.[caipAssetType]?.amount ?? token?.string,
        10,
      )
        .shiftedBy(-1 * token.decimals)
        .toString();
    }
    return undefined;
  }, [shouldUpdateBalance, token, nonEvmBalances]);

  if (token && typeof token.decimals !== 'number') {
    throw new Error(
      `Failed to calculate latest balance - ${token.symbol} token is missing "decimals" value`,
    );
  }

  const balance = useMemo(() => {
    return token?.chainId && isSolanaChainId(token.chainId)
      ? nonEvmBalance
      : value?.value;
  }, [nonEvmBalance, value?.value, token?.chainId]);

  return useMemo(
    () => (balance ? calcTokenAmount(balance, token?.decimals) : undefined),
    [balance, token?.decimals],
  );
};

export default useLatestBalance;
