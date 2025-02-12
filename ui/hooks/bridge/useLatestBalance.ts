import { useSelector } from 'react-redux';
import { type CaipChainId, type Hex, isCaipChainId } from '@metamask/utils';
import { Numeric } from '../../../shared/modules/Numeric';
import { getSelectedInternalAccount } from '../../selectors';
import { calcLatestSrcBalance } from '../../../shared/modules/bridge-utils/balance';
import { useAsyncResult } from '../useAsyncResult';
import { calcTokenAmount } from '../../../shared/lib/transactions-controller-utils';
import { useMultichainSelector } from '../useMultichainSelector';
import {
  getMultichainBalances,
  getMultichainCurrentChainId,
  getMultichainIsEvm,
  getMultichainSelectedAccountCachedBalance,
} from '../../selectors/multichain';
import { isNativeAddress } from '../../pages/bridge/utils/quote';

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
  const { address: selectedAddress, id } = useMultichainSelector(
    getSelectedInternalAccount,
  );
  const currentChainId = useMultichainSelector(getMultichainCurrentChainId);
  const isEvm = useMultichainSelector(getMultichainIsEvm);
  const multichainBalances = useSelector(getMultichainBalances);
  const multichainNativeBalance = useMultichainSelector(
    getMultichainSelectedAccountCachedBalance,
  );
  // console.log(
  //   '=====multichainBalances',
  //   multichainBalances,
  //   multichainNativeBalance,
  // );
  const { value: latestBalance } = useAsyncResult<
    Numeric | undefined
  >(async () => {
    if (
      token?.address &&
      chainId &&
      currentChainId === chainId &&
      !isCaipChainId(chainId) &&
      isEvm
    ) {
      return await calcLatestSrcBalance(
        global.ethereumProvider,
        selectedAddress,
        token.address,
        chainId,
      );
    }

    if (
      token?.address &&
      multichainBalances[id]?.[`${chainId}/${token?.address}`]?.amount
    ) {
      return Numeric.from(
        multichainBalances[id][`${chainId}/${token?.address}`].amount,
        10,
      );
    }

    if (token && isNativeAddress(token.address)) {
      return Numeric.from(multichainNativeBalance, 10);
    }

    return undefined;
  }, [
    chainId,
    currentChainId,
    token,
    selectedAddress,
    global.ethereumProvider,
    isEvm,
    multichainBalances,
    multichainNativeBalance,
    id,
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
