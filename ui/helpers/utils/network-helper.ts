import { type WellKnownChain } from '../../../shared/modules/well-known-chains';

export const getMatchedChain = (
  decimalChainId: number,
  wellKnownChains: Pick<WellKnownChain, 'chainId'>[],
) => {
  return wellKnownChains.find((chain) => chain.chainId === decimalChainId);
};

export const getMatchedSymbols = (
  decimalChainId: number,
  wellKnownChains: Pick<WellKnownChain, 'chainId' | 'nativeCurrency'>[],
): string[] => {
  return wellKnownChains.reduce<string[]>((accumulator, currentNetwork) => {
    if (currentNetwork.chainId === decimalChainId) {
      accumulator.push(currentNetwork.nativeCurrency.symbol);
    }
    return accumulator;
  }, []);
};

export const getMatchedNames = (
  decimalChainId: number,
  wellKnownChains: Pick<WellKnownChain, 'chainId' | 'name'>[],
): string[] => {
  return wellKnownChains.reduce<string[]>((accumulator, currentNetwork) => {
    if (currentNetwork.chainId === decimalChainId) {
      accumulator.push(currentNetwork.name);
    }
    return accumulator;
  }, []);
};
