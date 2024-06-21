export const getMatchedChain = (
  decimalChainId: string,
  safeChainsList: {
    chainId: string;
    name: string;
    nativeCurrency: { symbol: string };
  }[],
) => {
  return safeChainsList.find(
    (chain) => chain.chainId.toString() === decimalChainId,
  );
};

export const getMatchedSymbols = (
  decimalChainId: string,
  safeChainsList: {
    chainId: string;
    name: string;
    nativeCurrency: { symbol: string };
  }[],
): string[] => {
  return safeChainsList.reduce<string[]>((accumulator, currentNetwork) => {
    if (currentNetwork.chainId.toString() === decimalChainId) {
      accumulator.push(currentNetwork.nativeCurrency?.symbol);
    }
    return accumulator;
  }, []);
};
