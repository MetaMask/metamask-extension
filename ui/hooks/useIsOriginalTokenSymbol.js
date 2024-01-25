import { useEffect, useState } from 'react';
import { getTokenSymbol } from '../store/actions';

export function useIsOriginalTokenSymbol(tokenAddress, tokenSymbol) {
  const [isOriginalNativeSymbol, setIsOriginalNativeSymbol] = useState(null);

  useEffect(() => {
    async function getTokenSymbolForToken(address) {
      const symbol = await getTokenSymbol(address);
      setIsOriginalNativeSymbol(symbol === tokenSymbol);
    }
    getTokenSymbolForToken(tokenAddress);
  }, [isOriginalNativeSymbol, tokenAddress, tokenSymbol]);

  return isOriginalNativeSymbol;
}
