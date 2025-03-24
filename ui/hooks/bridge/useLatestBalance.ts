import { type Hex, type CaipChainId } from '@metamask/utils';
import { useMemo } from 'react';
import {
  isSolanaChainId,
  calcLatestSrcBalance,
  formatChainIdToCaip,
  formatChainIdToHex,
  ChainId,
} from '@metamask/bridge-controller';
import { useSelector } from 'react-redux';
import { getSelectedInternalAccount } from '../../selectors';
import { useAsyncResult } from '../useAsync';
import { Numeric } from '../../../shared/modules/Numeric';
import { calcTokenAmount } from '../../../shared/lib/transactions-controller-utils';
import { useMultichainSelector } from '../useMultichainSelector';
import {
  getMultichainBalances,
  getMultichainCurrentChainId,
} from '../../selectors/multichain';
import { getProviderConfig } from '../../../shared/modules/selectors/networks';

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
    chainId?: Hex | CaipChainId | ChainId;
  } | null,
) => {
  const { address: selectedAddress, id } = useMultichainSelector(
    getSelectedInternalAccount,
  );
  const currentChainId = useMultichainSelector(getMultichainCurrentChainId);

  const nonEvmBalancesByAccountId = useMultichainSelector(
    getMultichainBalances,
  );
  const { rpcUrl } = useSelector(getProviderConfig);

  const nonEvmBalances = nonEvmBalancesByAccountId?.[id];

  const value = useAsyncResult<string | undefined>(async () => {
    if (!token?.chainId || !token) {
      return undefined;
    }

    const { chainId } = token;

    // No need to fetch the balance for non-EVM tokens, use the balance provided by the
    // multichain balances controller
    if (isSolanaChainId(chainId) && token.decimals) {
      return Numeric.from(
        nonEvmBalances?.[token.address]?.amount ?? token.string,
        10,
      )
        .shiftedBy(-1 * token.decimals)
        .toString();
    }

    if (
      token.address &&
      formatChainIdToCaip(currentChainId) === formatChainIdToCaip(chainId) &&
      rpcUrl
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
  }, [currentChainId, token, selectedAddress, rpcUrl, nonEvmBalances]);

  if (token && !token.decimals) {
    throw new Error(
      `Failed to calculate latest balance - ${token.symbol} token is missing "decimals" value`,
    );
  }

  return useMemo(
    () =>
      value?.value ? calcTokenAmount(value.value, token?.decimals) : undefined,
    [value?.value, token?.decimals],
  );
};

export default useLatestBalance;
