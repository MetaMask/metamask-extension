// TODO: reconsider this approach altogether
// checking against on-chain data to see if a user has changed a token symbol is not ideal
// we should just keep track of the original symbol in state, or better yet, rely on the address instead of the symbol
// see: https://github.com/MetaMask/metamask-extension/pull/21610 (original PR)

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { getTokenSymbol } from '../store/actions';
import { getTokenList } from '../selectors';

/**
 * This hook determines whether a token uses the original symbol based on data not influenced by the user.
 *
 * @param {string} tokenAddress - the address of the token
 * @param {string} tokenSymbol - the local symbol of the token
 * @returns a boolean indicating whether the token uses the original symbol
 */
export function useIsOriginalTokenSymbol(tokenAddress, tokenSymbol) {
  const [isOriginalNativeSymbol, setIsOriginalNativeSymbol] = useState(null);

  const tokens = useSelector(getTokenList);

  useEffect(() => {
    async function getTokenSymbolForToken(address) {
      // attempt to fetch from cache first
      let trueSymbol = tokens[address?.toLowerCase()]?.symbol;

      // if tokens aren't available, fetch from the blockchain
      if (!trueSymbol) {
        trueSymbol = await getTokenSymbol(address);
      }

      // if the symbol is the same as the tokenSymbol, it's the original
      setIsOriginalNativeSymbol(
        trueSymbol?.toLowerCase() === tokenSymbol?.toLowerCase(),
      );
    }

    getTokenSymbolForToken(tokenAddress);
    // no need to wait for tokens to load, since we'd fetch without them if they aren't available
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenAddress, tokenSymbol]);

  return isOriginalNativeSymbol;
}
