import { useSelector } from 'react-redux';
import { CaipChainId, Hex } from '@metamask/utils';
import { Numeric } from '../../../shared/modules/Numeric';
import { getCurrentChainId } from '../../../shared/modules/selectors/networks';
import { getSelectedInternalAccount } from '../../selectors';
import { calcLatestSrcBalance } from '../../../shared/modules/bridge-utils/balance';
import { useAsyncResult } from '../useAsyncResult';
import { calcTokenAmount } from '../../../shared/lib/transactions-controller-utils';
import { useMultichainSelector } from '../useMultichainSelector';
import {
  getMultichainCurrentChainId,
  getMultichainIsSolana,
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
  } | null,
  chainId?: Hex | CaipChainId,
) => {
  const isSolana = useMultichainSelector(getMultichainIsSolana);

  const { address: selectedAddress } = useSelector(getSelectedInternalAccount);
  const currentChainId = useSelector(getMultichainCurrentChainId);

  const { value: latestBalance } = useAsyncResult<
    Numeric | undefined
  >(async () => {
    if (token?.address && chainId && currentChainId === chainId) {
      if (isSolana) {
        return undefined; // TODO query latest balance
      }
      return await calcLatestSrcBalance(
        global.ethereumProvider,
        selectedAddress,
        token.address,
        chainId,
      );
    }
    return undefined;
  }, [
    isSolana,
    chainId,
    currentChainId,
    token,
    selectedAddress,
    global.ethereumProvider,
  ]);

  if (token && !token.decimals) {
    // throw new Error(
    //     `Failed to calculate latest balance - ${token.symbol} token is missing "decimals" value`,
    //   );
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
