import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { CaipChainId, Hex } from '@metamask/utils';
import { type Asset } from '../../types/send';
import { getUseExternalServices } from '../../../../selectors';
import { isEvmChainId } from '../../../../../shared/lib/asset-utils';
import { useSendTokens } from './useSendTokens';
import { useSendNfts } from './useSendNfts';

type SendAssets = {
  nfts: Asset[];
  tokens: Asset[];
};

export const useSendAssets = (): SendAssets => {
  const tokens = useSendTokens();
  const nfts = useSendNfts();
  const useExternalServices = useSelector(getUseExternalServices);

  return useMemo(() => {
    // When BFT is OFF, filter out non-EVM tokens
    if (!useExternalServices) {
      const filteredTokens = tokens.filter((token) => {
        // chainId is Hex for EVM chains or CaipChainId for non-EVM chains
        return isEvmChainId(token.chainId as CaipChainId | Hex);
      });
      const filteredNfts = nfts.filter((nft) => {
        // Filter out non-EVM NFTs to prevent their chain IDs from appearing
        // in the network filter dropdown
        return isEvmChainId(nft.chainId as CaipChainId | Hex);
      });
      return {
        tokens: filteredTokens,
        nfts: filteredNfts,
      };
    }

    return {
      tokens,
      nfts,
    };
  }, [tokens, nfts, useExternalServices]);
};
