import {
  CaipChainId,
  Hex,
  isCaipChainId,
  isStrictHexString,
} from '@metamask/utils';
import { useMemo } from 'react';
import { Numeric } from '../../../shared/modules/Numeric';
import { getSelectedInternalAccount } from '../../selectors';
import { calcLatestSrcBalance } from '../../../shared/modules/bridge-utils/balance';
import { useAsyncResult } from '../useAsyncResult';
import { calcTokenAmount } from '../../../shared/lib/transactions-controller-utils';
import { useMultichainSelector } from '../useMultichainSelector';
import {
  getMultichainBalances,
  getMultichainCurrentChainId,
} from '../../selectors/multichain';

/**
 * Custom hook to fetch and format the latest balance of a given token or native asset.
 *
 * @param token - The token object for which the balance is to be fetched. Can be null.
 * @param chainId - The chain ID to be used for fetching the balance. Optional.
 * @returns An object containing the balanceAmount as a string.
 */
const useLatestBalance = (
  token: {
    address: string;
    decimals: number;
    symbol: string;
    string?: string;
  } | null,
  chainId?: Hex | CaipChainId,
) => {
  const { address: selectedAddress, id } = useMultichainSelector(
    getSelectedInternalAccount,
  );
  const currentChainId = useMultichainSelector(getMultichainCurrentChainId);

  const nonEvmBalancesByAccountId = useMultichainSelector(
    getMultichainBalances,
  );
  const nonEvmBalances = nonEvmBalancesByAccountId[id];

  const value = useAsyncResult<Numeric | undefined>(async () => {
    if (
      token?.address &&
      chainId &&
      currentChainId === chainId &&
      isStrictHexString(chainId)
    ) {
      return await calcLatestSrcBalance(
        global.ethereumProvider,
        selectedAddress,
        token.address,
        chainId,
      );
    }

    if (isCaipChainId(chainId) && token?.decimals) {
      return Numeric.from(
        nonEvmBalances?.[token.address]?.amount ?? token?.string,
      ).shiftedBy(-1 * token.decimals);
    }

    return undefined;
  }, [
    chainId,
    currentChainId,
    token,
    selectedAddress,
    global.ethereumProvider,
    nonEvmBalances,
  ]);

  if (token && !token.decimals) {
    throw new Error(
      `Failed to calculate latest balance - ${token.symbol} token is missing "decimals" value`,
    );
  }

  return useMemo(
    () =>
      value?.value
        ? calcTokenAmount(value.value.toString(), token?.decimals)
        : undefined,
    [value, token?.decimals],
  );
};

export default useLatestBalance;
