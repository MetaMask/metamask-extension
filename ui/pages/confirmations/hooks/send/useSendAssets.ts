import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import {
  isCaipChainId,
  isStrictHexString,
  numberToHex,
  type CaipChainId,
  type Hex,
} from '@metamask/utils';
import { type Asset } from '../../types/send';
import { getUseExternalServices } from '../../../../selectors';
import { getAllMultichainNetworkConfigurations } from '../../../../selectors/multichain/networks';
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
  const allMultichainNetworkConfigurations = useSelector(
    getAllMultichainNetworkConfigurations,
  );

  // Helper to check if a chain ID is in the available networks
  const isChainIdAvailable = useCallback(
    (chainId: string): boolean => {
      if (!chainId) {
        return false;
      }
      const availableChainIds = Object.keys(allMultichainNetworkConfigurations);
      // Check direct match (for CAIP chain IDs like solana:..., bip122:..., etc.)
      if (availableChainIds.includes(chainId)) {
        return true;
      }
      // For EVM chains, convert to CAIP format and check. Decimal strings
      // such as "57073" are base-10 chain ids; `toEvmCaipChainId` parses
      // unprefixed input as hex and would miss the real network.
      if (isEvmChainId(chainId as CaipChainId | Hex)) {
        const caipChainId = toCaipChainIdForSendAsset(chainId);
        return (
          caipChainId !== undefined && availableChainIds.includes(caipChainId)
        );
      }
      return false;
    },
    [allMultichainNetworkConfigurations],
  );

  return useMemo(() => {
    // Filter out assets from networks that are not in the Network Manager
    const networkFilteredTokens = tokens.filter((token) => {
      const chainId = String(token.chainId ?? '');
      return isChainIdAvailable(chainId);
    });
    const networkFilteredNfts = nfts.filter((nft) => {
      if (nft.chainId === undefined) {
        return false;
      }
      const chainId = String(nft.chainId);
      return isChainIdAvailable(chainId);
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
  }, [tokens, nfts, useExternalServices, isChainIdAvailable]);
};

/**
 * Maps a send-asset chain id to the CAIP id used by network configuration.
 * Hex ids stay hex. Decimal strings are parsed as base-10 before conversion.
 *
 * @param chainId - Hex, CAIP, or decimal-string chain id from the asset list.
 * @returns The CAIP chain id, or undefined when the value is not an EVM id.
 */
function toCaipChainIdForSendAsset(chainId: string): CaipChainId | undefined {
  if (isCaipChainId(chainId)) {
    return chainId;
  }

  if (isStrictHexString(chainId)) {
    return toEvmCaipChainId(chainId);
  }

  if (!/^\d+$/u.test(chainId)) {
    return undefined;
  }

  return toEvmCaipChainId(numberToHex(Number(chainId)));
}
