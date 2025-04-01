import { useSelector } from 'react-redux';
import {
  type TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import type { NetworkConfiguration } from '@metamask/network-controller';
import type { Hex } from '@metamask/utils';
import type { BridgeHistoryItem } from '../../../shared/types/bridge-status';
import {
  CHAIN_ID_TO_CURRENCY_SYMBOL_MAP,
  NETWORK_TO_NAME_MAP,
} from '../../../shared/constants/network';
import { CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP } from '../../../shared/constants/common';
import { getMultichainNetworkConfigurationsByChainId } from '../../selectors';
import { formatChainIdToHexOrCaip } from '../../../shared/modules/bridge-utils/caip-formatters';

const getSourceAndDestChainIds = ({
  bridgeHistoryItem,
}: UseBridgeChainInfoProps) => {
  return {
    srcChainId: bridgeHistoryItem
      ? formatChainIdToHexOrCaip(bridgeHistoryItem.quote.srcChainId)
      : undefined,
    destChainId: bridgeHistoryItem
      ? formatChainIdToHexOrCaip(bridgeHistoryItem.quote.destChainId)
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
  const srcNetwork = networkConfigurationsByChainId[
    srcChainId as keyof typeof networkConfigurationsByChainId
  ]
    ? networkConfigurationsByChainId[
        srcChainId as keyof typeof networkConfigurationsByChainId
      ]
    : undefined;
  const fallbackSrcNetwork = {
    chainId: srcChainId,
    name: NETWORK_TO_NAME_MAP[srcChainId as keyof typeof NETWORK_TO_NAME_MAP],
    nativeCurrency:
      CHAIN_ID_TO_CURRENCY_SYMBOL_MAP[
        srcChainId as keyof typeof CHAIN_ID_TO_CURRENCY_SYMBOL_MAP
      ],
    defaultBlockExplorerUrlIndex: 0,
    blockExplorerUrls: [CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP[srcChainId]],
    defaultRpcEndpointIndex: 0,
    rpcEndpoints: [],
  };

  // Dest chain info
  const destNetwork = networkConfigurationsByChainId[
    destChainId as keyof typeof networkConfigurationsByChainId
  ]
    ? networkConfigurationsByChainId[
        destChainId as keyof typeof networkConfigurationsByChainId
      ]
    : undefined;
  const fallbackDestNetwork: NetworkConfiguration = {
    chainId: destChainId as Hex,
    name: NETWORK_TO_NAME_MAP[destChainId as keyof typeof NETWORK_TO_NAME_MAP],
    nativeCurrency:
      CHAIN_ID_TO_CURRENCY_SYMBOL_MAP[
        destChainId as keyof typeof CHAIN_ID_TO_CURRENCY_SYMBOL_MAP
      ],
    defaultBlockExplorerUrlIndex: 0,
    blockExplorerUrls: [CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP[destChainId]],
    defaultRpcEndpointIndex: 0,
    rpcEndpoints: [],
  };

  return {
    srcNetwork: srcNetwork || fallbackSrcNetwork,
    destNetwork: destNetwork || fallbackDestNetwork,
  };
}
