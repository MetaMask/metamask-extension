import {
  type TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import {
  formatChainIdToCaip,
  formatChainIdToHex,
  getNativeAssetForChainId,
  isSolanaChainId,
} from '@metamask/bridge-controller';
import { BridgeHistoryItem } from '@metamask/bridge-status-controller';
import { CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP } from '../../../shared/constants/common';
import { NETWORK_TO_SHORT_NETWORK_NAME_MAP } from '../../../shared/constants/bridge';

const getSourceAndDestChainIds = ({
  bridgeHistoryItem,
}: UseBridgeChainInfoProps) => {
  return {
    srcChainId: bridgeHistoryItem
      ? bridgeHistoryItem.quote.srcChainId
      : undefined,
    destChainId: bridgeHistoryItem
      ? bridgeHistoryItem.quote.destChainId
      : undefined,
  };
};

export type UseBridgeChainInfoProps = {
  bridgeHistoryItem?: BridgeHistoryItem;
  srcTxMeta?: TransactionMeta;
};

export default function useBridgeChainInfo({
  bridgeHistoryItem,
  srcTxMeta,
}: UseBridgeChainInfoProps) {
  if (srcTxMeta?.type !== TransactionType.bridge) {
    return {
      srcNetwork: undefined,
      destNetwork: undefined,
    };
  }

  const { srcChainId, destChainId } = getSourceAndDestChainIds({
    bridgeHistoryItem,
  });

  if (!srcChainId || !destChainId) {
    return {
      srcNetwork: undefined,
      destNetwork: undefined,
    };
  }

  // Source chain info
  const srcChainIdInCaip = formatChainIdToCaip(srcChainId);
  const normalizedSrcChainId = isSolanaChainId(srcChainId)
    ? srcChainIdInCaip
    : formatChainIdToHex(srcChainId);

  const commonSrcNetworkFields = {
    chainId: srcChainIdInCaip,
    name: NETWORK_TO_SHORT_NETWORK_NAME_MAP[
      normalizedSrcChainId as keyof typeof NETWORK_TO_SHORT_NETWORK_NAME_MAP
    ],
  };

  const srcNetwork = {
    ...commonSrcNetworkFields,
    ...(isSolanaChainId(srcChainIdInCaip)
      ? ({
          isEvm: false,
          nativeCurrency: getNativeAssetForChainId(srcChainId)?.assetId,
        } as const)
      : {
          defaultBlockExplorerUrlIndex: 0,
          blockExplorerUrls: [
            CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP[normalizedSrcChainId],
          ],
          defaultRpcEndpointIndex: 0,
          rpcEndpoints: [],
          nativeCurrency: getNativeAssetForChainId(srcChainId)?.symbol,
          isEvm: true as const,
        }),
  };

  // Dest chain info
  const destChainIdInCaip = formatChainIdToCaip(destChainId);
  const normalizedDestChainId = isSolanaChainId(destChainId)
    ? destChainIdInCaip
    : formatChainIdToHex(destChainId);

  const commonDestNetworkFields = {
    chainId: destChainIdInCaip,
    name: NETWORK_TO_SHORT_NETWORK_NAME_MAP[
      normalizedDestChainId as keyof typeof NETWORK_TO_SHORT_NETWORK_NAME_MAP
    ],
  };

  const destNetwork = {
    ...commonDestNetworkFields,
    ...(isSolanaChainId(destChainIdInCaip)
      ? ({
          isEvm: false,
          nativeCurrency: getNativeAssetForChainId(destChainId)?.assetId,
        } as const)
      : {
          defaultBlockExplorerUrlIndex: 0,
          blockExplorerUrls: [
            CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP[normalizedDestChainId],
          ],
          defaultRpcEndpointIndex: 0,
          rpcEndpoints: [],
          nativeCurrency: getNativeAssetForChainId(destChainId)?.symbol,
          isEvm: true as const,
        }),
  };

  return {
    srcNetwork,
    destNetwork,
  };
}
