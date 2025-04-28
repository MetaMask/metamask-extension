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

/**
 * Returns the host of the first RPC URL that matches the given RPC URL's host.
 *
 * @param rpcUrl - The RPC URL to match against
 * @param wellKnownChains - The list of well-known chains to check against
 */
export function* getMatchedChainByRpcHost(
  host: string,
  wellKnownChains: Pick<WellKnownChain, 'rpc'>[],
): IterableIterator<Pick<WellKnownChain, 'rpc'>> {
  for (const chain of wellKnownChains) {
    for (const rpc of chain.rpc) {
      if (new URL(rpc).host === host) {
        yield chain;
        break;
      }
    }
  }
}
