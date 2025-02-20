import {
  CaipChainId,
  Hex,
  isCaipChainId,
  isStrictHexString,
} from '@metamask/utils';
import type { BigNumber } from 'bignumber.js';
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
import { calcTokenValue } from '../../../shared/lib/swaps-utils';

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

  const { value: latestBalance } = useAsyncResult<
    Numeric | BigNumber | undefined
  >(async () => {
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

    if (isCaipChainId(chainId) && token?.decimals && token?.string) {
      return calcTokenValue(
        nonEvmBalances?.[`${token.address}`]?.amount ?? token.string,
        token.decimals,
      );
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

  const tokenDecimals = token?.decimals ? Number(token.decimals) : 1;

  return {
    balanceAmount:
      token && latestBalance
        ? calcTokenAmount(latestBalance.toString(), tokenDecimals)
        : undefined,
  };
};

export default useLatestBalance;
