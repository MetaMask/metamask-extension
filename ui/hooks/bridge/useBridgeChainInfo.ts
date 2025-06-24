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
import { type ChainInfo } from '../../pages/bridge/utils/tx-details';
import { NETWORK_TO_SHORT_NETWORK_NAME_MAP } from '../../../shared/constants/bridge';
import { SOLANA_BLOCK_EXPLORER_URL } from '../../../shared/constants/multichain/networks';

const getSourceAndDestChainIds = ({ quote }: BridgeHistoryItem) => {
  const { srcChainId, destChainId } = quote;
  return {
    srcChainId,
    destChainId,
  };
};

export type UseBridgeChainInfoProps = {
  bridgeHistoryItem?: BridgeHistoryItem;
  srcTxMeta?: TransactionMeta;
};

export default function useBridgeChainInfo({
  bridgeHistoryItem,
  srcTxMeta,
}: UseBridgeChainInfoProps): {
  srcNetwork?: ChainInfo;
  destNetwork?: ChainInfo;
} {
  if (
    srcTxMeta?.type &&
    ![TransactionType.bridge, TransactionType.swap].includes(srcTxMeta.type)
  ) {
    return {
      srcNetwork: undefined,
      destNetwork: undefined,
    };
  }

  const { srcChainId, destChainId } = bridgeHistoryItem
    ? getSourceAndDestChainIds(bridgeHistoryItem)
    : {
        srcChainId: srcTxMeta?.chainId,
        destChainId: srcTxMeta?.chainId,
      };

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
          blockExplorerUrl: SOLANA_BLOCK_EXPLORER_URL,
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
          blockExplorerUrl: SOLANA_BLOCK_EXPLORER_URL,
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
