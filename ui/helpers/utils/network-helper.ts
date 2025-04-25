export const getMatchedChain = (
  decimalChainId: number,
  wellKnownChains: {
    chainId: number;
    name: string;
    nativeCurrency: { symbol: string };
  }[],
) => {
  return wellKnownChains.find((chain) => chain.chainId === decimalChainId);
};

export const getMatchedSymbols = (
  decimalChainId: number,
  wellKnownChains: {
    chainId: number;
    name: string;
    nativeCurrency: { symbol: string };
  }[],
): string[] => {
  return wellKnownChains.reduce<string[]>((accumulator, currentNetwork) => {
    if (currentNetwork.chainId === decimalChainId) {
      accumulator.push(currentNetwork.nativeCurrency?.symbol);
    }
    return accumulator;
  }, []);
};

export const getMatchedNames = (
  decimalChainId: number,
  wellKnownChains: {
    chainId: number;
    name: string;
    nativeCurrency: { symbol: string; name: string };
  }[],
): string[] => {
  return wellKnownChains.reduce<string[]>((accumulator, currentNetwork) => {
    if (currentNetwork.chainId === decimalChainId) {
      accumulator.push(currentNetwork?.name);
    }
    return accumulator;
  }, []);
};
