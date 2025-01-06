import { useSelector } from 'react-redux';
import { Hex } from '@metamask/utils';
import { Numeric } from '../../../shared/modules/Numeric';
import { getCurrentChainId } from '../../../shared/modules/selectors/networks';
import { getSelectedInternalAccount } from '../../selectors';
import { calcLatestSrcBalance } from '../../../shared/modules/bridge-utils/balance';
import { useAsyncResult } from '../useAsyncResult';
import { calcTokenAmount } from '../../../shared/lib/transactions-controller-utils';

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
  } | null,
  chainId?: Hex,
) => {
  const { address: selectedAddress } = useSelector(getSelectedInternalAccount);
  const currentChainId = useSelector(getCurrentChainId);

  const { value: latestBalance } = useAsyncResult<
    Numeric | undefined
  >(async () => {
    if (token?.address && chainId && currentChainId === chainId) {
      return await calcLatestSrcBalance(
        global.ethereumProvider,
        selectedAddress,
        token.address,
        chainId,
      );
    }
    return undefined;
  }, [
    chainId,
    currentChainId,
    token,
    selectedAddress,
    global.ethereumProvider,
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
