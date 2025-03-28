import { useSelector } from 'react-redux';
import {
  type TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import {
  formatChainIdToCaip,
  formatChainIdToHex,
  isSolanaChainId,
} from '@metamask/bridge-controller';
import type { BridgeHistoryItem } from '../../../shared/types/bridge-status';
import {
  CHAIN_ID_TO_CURRENCY_SYMBOL_MAP,
  NETWORK_TO_NAME_MAP,
} from '../../../shared/constants/network';
import { CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP } from '../../../shared/constants/common';
import { getMultichainNetworkConfigurationsByChainId } from '../../selectors';

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
  const [networkConfigurationsByChainId] =
    useSelector(getMultichainNetworkConfigurationsByChainId) ?? [];

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
  const srcNetwork = networkConfigurationsByChainId[srcChainIdInCaip];
  const normalizedSrcChainId = isSolanaChainId(srcChainId)
    ? srcChainIdInCaip
    : formatChainIdToHex(srcChainId);
  const fallbackSrcNetwork = {
    chainId: normalizedSrcChainId,
    name: NETWORK_TO_NAME_MAP[
      normalizedSrcChainId as keyof typeof NETWORK_TO_NAME_MAP
    ],
    nativeCurrency:
      CHAIN_ID_TO_CURRENCY_SYMBOL_MAP[
        normalizedSrcChainId as keyof typeof CHAIN_ID_TO_CURRENCY_SYMBOL_MAP
      ],
    defaultBlockExplorerUrlIndex: 0,
    blockExplorerUrls: [
      CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP[normalizedSrcChainId],
    ],
    defaultRpcEndpointIndex: 0,
    rpcEndpoints: [],
  };

  // Dest chain info
  const destChainIdInCaip = formatChainIdToCaip(destChainId);
  const destNetwork = networkConfigurationsByChainId[destChainIdInCaip];
  const normalizedDestChainId = isSolanaChainId(destChainId)
    ? destChainIdInCaip
    : formatChainIdToHex(destChainId);
  const fallbackDestNetwork = {
    chainId: normalizedDestChainId,
    name: NETWORK_TO_NAME_MAP[
      normalizedDestChainId as keyof typeof NETWORK_TO_NAME_MAP
    ],
    nativeCurrency:
      CHAIN_ID_TO_CURRENCY_SYMBOL_MAP[
        normalizedDestChainId as keyof typeof CHAIN_ID_TO_CURRENCY_SYMBOL_MAP
      ],
    defaultBlockExplorerUrlIndex: 0,
    blockExplorerUrls: [
      CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP[normalizedDestChainId],
    ],
    defaultRpcEndpointIndex: 0,
    rpcEndpoints: [],
  };

  return {
    srcNetwork: srcNetwork || fallbackSrcNetwork,
    destNetwork: destNetwork || fallbackDestNetwork,
  };
}
