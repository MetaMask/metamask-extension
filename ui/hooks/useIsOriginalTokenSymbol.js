import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { getTokenSymbol } from '../store/actions';
import { getTokenList } from '../selectors';

export function useIsOriginalTokenSymbol(tokenAddress, tokenSymbol) {
  const [isOriginalNativeSymbol, setIsOriginalNativeSymbol] = useState(null);

  const tokens = useSelector(getTokenList);

  useEffect(() => {
    async function getTokenSymbolForToken(address) {
      // attempt to fetch from cache first
      let symbol = tokens[address?.toLowerCase()]?.symbol;

      if (!symbol) {
        symbol = await getTokenSymbol(address);
      }

      setIsOriginalNativeSymbol(
        symbol?.toLowerCase() === tokenSymbol?.toLowerCase(),
      );
    }
    getTokenSymbolForToken(tokenAddress);
    // no need to wait for tokens to load, since we'd fetch without it if it's not available
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenAddress, tokenSymbol]);

  return isOriginalNativeSymbol;
}
