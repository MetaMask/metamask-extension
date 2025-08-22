import { CaipChainId } from '@metamask/utils';

export const getSanitizedChainId = (chainId: CaipChainId) => {
  if (chainId.startsWith('eip155')) {
    return 'eip155:0';
  }
  return chainId;
};
