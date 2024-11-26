import { useSelector } from 'react-redux';
import { Hex } from '@metamask/utils';
import { NetworkConfiguration } from '@metamask/network-controller';
import { Numeric } from '../../../shared/modules/Numeric';
import { getNetworkConfigurationsByChainId } from '../../../shared/modules/selectors/networks';
import { BridgeHistoryItem } from '../../../shared/types/bridge-status';
import {
  CHAIN_ID_TO_CURRENCY_SYMBOL_MAP,
  NETWORK_TO_NAME_MAP,
} from '../../../shared/constants/network';
import { CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP } from '../../../shared/constants/common';

export type UseBridgeChainInfoProps = {
  bridgeHistoryItem?: BridgeHistoryItem;
};

export default function useBridgeChainInfo({
  bridgeHistoryItem,
}: UseBridgeChainInfoProps) {
  const networkConfigurationsByChainId = useSelector(
    getNetworkConfigurationsByChainId,
  );

  const decSrcChainId = bridgeHistoryItem?.quote.srcChainId;
  const hexSrcChainId = decSrcChainId
    ? (new Numeric(decSrcChainId, 10).toPrefixedHexString() as Hex)
    : undefined;

  const decDestChainId = bridgeHistoryItem?.quote.destChainId;
  const hexDestChainId = decDestChainId
    ? (new Numeric(decDestChainId, 10).toPrefixedHexString() as Hex)
    : undefined;

  if (!bridgeHistoryItem || !hexSrcChainId || !hexDestChainId) {
    return {
      srcNetwork: undefined,
      destNetwork: undefined,
    };
  }

  // Source chain info
  const srcNetwork = networkConfigurationsByChainId[hexSrcChainId]
    ? networkConfigurationsByChainId[hexSrcChainId]
    : undefined;
  const fallbackSrcNetwork: NetworkConfiguration = {
    chainId: hexSrcChainId,
    name: NETWORK_TO_NAME_MAP[
      hexSrcChainId as keyof typeof NETWORK_TO_NAME_MAP
    ],
    nativeCurrency:
      CHAIN_ID_TO_CURRENCY_SYMBOL_MAP[
        hexSrcChainId as keyof typeof CHAIN_ID_TO_CURRENCY_SYMBOL_MAP
      ],
    defaultBlockExplorerUrlIndex: 0,
    blockExplorerUrls: [CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP[hexSrcChainId]],
    defaultRpcEndpointIndex: 0,
    rpcEndpoints: [],
  };

  // Dest chain info
  const destNetwork = networkConfigurationsByChainId[hexDestChainId]
    ? networkConfigurationsByChainId[hexDestChainId]
    : undefined;
  const fallbackDestNetwork: NetworkConfiguration = {
    chainId: hexDestChainId,
    name: NETWORK_TO_NAME_MAP[
      hexDestChainId as keyof typeof NETWORK_TO_NAME_MAP
    ],
    nativeCurrency:
      CHAIN_ID_TO_CURRENCY_SYMBOL_MAP[
        hexDestChainId as keyof typeof CHAIN_ID_TO_CURRENCY_SYMBOL_MAP
      ],
    defaultBlockExplorerUrlIndex: 0,
    blockExplorerUrls: [CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP[hexDestChainId]],
    defaultRpcEndpointIndex: 0,
    rpcEndpoints: [],
  };

  return {
    srcNetwork: srcNetwork || fallbackSrcNetwork,
    destNetwork: destNetwork || fallbackDestNetwork,
  };
}
