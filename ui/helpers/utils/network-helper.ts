import { NON_EVM_TESTNET_IDS } from '@metamask/multichain-network-controller';
import { CaipChainId, type Hex, isCaipChainId } from '@metamask/utils';
import { TEST_CHAINS } from '../../../shared/constants/network';
import { convertCaipToHexChainId } from '../../../shared/modules/network.utils'

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

export const getMatchedNames = (
  decimalChainId: string,
  safeChainsList: {
    chainId: string;
    name: string;
    nativeCurrency: { symbol: string; name: string };
  }[],
): string[] => {
  return safeChainsList.reduce<string[]>((accumulator, currentNetwork) => {
    if (currentNetwork.chainId.toString() === decimalChainId) {
      accumulator.push(currentNetwork?.name);
    }
    return accumulator;
  }, []);
};

/**
 * Checks if the given chain ID is a test network.
 *
 * @param chainId - The chain ID to check.
 * @returns True if the chain ID is a test network, false otherwise.
 */
export const isTestNetwork = (chainId: CaipChainId | Hex) => {
  if (!isCaipChainId(chainId)) {
    return TEST_CHAINS.includes(chainId);
  }

  if (chainId.startsWith('eip155:')) {
    return TEST_CHAINS.includes(convertCaipToHexChainId(chainId));
  }

  return NON_EVM_TESTNET_IDS.includes(chainId);
};
