import { useSelector } from 'react-redux';
import { zeroAddress } from 'ethereumjs-util';
import { Web3Provider } from '@ethersproject/providers';
import { Hex } from '@metamask/utils';
import { BigNumber } from 'ethers';
import { Numeric } from '../../../shared/modules/Numeric';
import { DEFAULT_PRECISION } from '../useCurrencyDisplay';
import { fetchTokenBalance } from '../../../shared/lib/token-util';
import {
  getCurrentChainId,
  getSelectedInternalAccount,
  SwapsEthToken,
} from '../../selectors';
import { SwapsTokenObject } from '../../../shared/constants/swaps';
import { useAsyncResult } from '../useAsyncResult';

/**
 * Custom hook to fetch and format the latest balance of a given token or native asset.
 *
 * @param token - The token object for which the balance is to be fetched. Can be null.
 * @param chainId - The chain ID to be used for fetching the balance. Optional.
 * @returns An object containing the formatted balance as a string.
 */
const useLatestBalance = (
  token: SwapsTokenObject | SwapsEthToken | null,
  chainId?: Hex,
) => {
  const { address: selectedAddress } = useSelector(getSelectedInternalAccount);
  const currentChainId = useSelector(getCurrentChainId);

  const { value: latestBalance } = useAsyncResult<BigNumber>(async () => {
    if (token && chainId && currentChainId === chainId) {
      if (!token.address || token.address === zeroAddress()) {
        const ethersProvider = new Web3Provider(global.ethereumProvider);
        return await ethersProvider.getBalance(selectedAddress);
      }
      return await fetchTokenBalance(
        token.address,
        selectedAddress,
        global.ethereumProvider,
      );
    }

    return undefined;
  }, [token, selectedAddress, global.ethereumProvider]);

  if (token && !token.decimals) {
    throw new Error(
      `Failed to calculate latest balance - ${token.symbol} token is missing "decimals" value`,
    );
  }

  const tokenDecimals = token?.decimals ? Number(token.decimals) : 1;

  return {
    formattedBalance:
      token && latestBalance
        ? Numeric.from(latestBalance.toString(), 10)
            .shiftedBy(tokenDecimals)
            .round(DEFAULT_PRECISION)
            .toString()
        : undefined,
  };
};

export default useLatestBalance;
