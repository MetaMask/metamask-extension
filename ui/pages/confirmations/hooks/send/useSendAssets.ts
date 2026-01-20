import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { CaipChainId, Hex } from '@metamask/utils';
import { type Asset } from '../../types/send';
import { getUseExternalServices } from '../../../../selectors';
import { getAllEnabledNetworksForAllNamespaces } from '../../../../selectors/multichain/networks';
import { isEvmChainId } from '../../../../../shared/lib/asset-utils';
import { useSendTokens } from './useSendTokens';
import { useSendNfts } from './useSendNfts';

type SendAssets = {
  nfts: Asset[];
  tokens: Asset[];
};

type UseSendAssetsOptions = {
  includeNoBalance?: boolean;
};

export const useSendAssets = (
  options: UseSendAssetsOptions = {},
): SendAssets => {
  const { includeNoBalance = false } = options;
  const tokens = useSendTokens({ includeNoBalance });
  const nfts = useSendNfts();
  const useExternalServices = useSelector(getUseExternalServices);
  const enabledNetworks = useSelector(getAllEnabledNetworksForAllNamespaces);

  return useMemo(() => {
    // Filter out assets from networks that are not in the Network Manager
    const networkFilteredTokens = tokens.filter((token) => {
      const chainId = String(token.chainId ?? '');
      return chainId && enabledNetworks.includes(chainId);
    });
    const networkFilteredNfts = nfts.filter((nft) => {
      if (nft.chainId === undefined) {
        return false;
      }
      const chainId = String(nft.chainId);
      return enabledNetworks.includes(chainId);
    });

    // When BFT is OFF, filter out non-EVM tokens and NFTs
    if (!useExternalServices) {
      const filteredTokens = networkFilteredTokens.filter((token) => {
        // chainId is Hex for EVM chains or CaipChainId for non-EVM chains
        return isEvmChainId(token.chainId as CaipChainId | Hex);
      });
      const filteredNfts = networkFilteredNfts.filter((nft) => {
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
      tokens: networkFilteredTokens,
      nfts: networkFilteredNfts,
    };
  }, [tokens, nfts, useExternalServices, enabledNetworks]);
};
