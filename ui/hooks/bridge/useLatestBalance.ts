import { type Hex, type CaipChainId, isCaipChainId } from '@metamask/utils';
import { BigNumber } from 'bignumber.js';
import { getSelectedInternalAccount } from '../../selectors';
import { calcLatestSrcBalance } from '../../../shared/modules/bridge-utils/balance';
import { useAsyncResult } from '../useAsyncResult';
import { useMultichainSelector } from '../useMultichainSelector';
import {
  getMultichainBalances,
  getMultichainCurrentChainId,
} from '../../selectors/multichain';
import { MultichainNetworks } from '../../../shared/constants/multichain/networks';

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

  const { value: balanceAmount } = useAsyncResult<
    string | undefined
  >(async () => {
    if (
      token?.address &&
      // TODO check whether chainId is EVM when MultichainNetworkController is integrated
      !isCaipChainId(chainId) &&
      chainId &&
      currentChainId === chainId
    ) {
      const balanceValue = await calcLatestSrcBalance(
        global.ethereumProvider,
        selectedAddress,
        token.address,
        chainId,
      );
      return balanceValue?.shiftedBy(token.decimals).toString();
    }

    // No need to fetch the balance for non-EVM tokens, use the balance provided by the
    // multichain balances controller
    if (
      isCaipChainId(chainId) &&
      chainId === MultichainNetworks.SOLANA &&
      token?.decimals
    ) {
      return nonEvmBalances?.[token.address]?.amount ?? token?.string;
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

  return {
    balanceAmount: balanceAmount ? new BigNumber(balanceAmount) : undefined,
  };
};

export default useLatestBalance;
