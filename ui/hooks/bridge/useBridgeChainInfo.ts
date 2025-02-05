import { useSelector } from 'react-redux';
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { NetworkConfiguration } from '@metamask/network-controller';
import { isCaipChainId } from '@metamask/utils';
import { getNetworkConfigurationsByChainId } from '../../../shared/modules/selectors/networks';
import { BridgeHistoryItem } from '../../../shared/types/bridge-status';
import {
  CHAIN_ID_TO_CURRENCY_SYMBOL_MAP,
  NETWORK_TO_NAME_MAP,
} from '../../../shared/constants/network';
import { CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP } from '../../../shared/constants/common';
import { formatChainIdFromDecimal } from '../../../shared/modules/bridge-utils/multichain';
import { MULTICHAIN_PROVIDER_CONFIGS } from '../../../shared/constants/multichain/networks';

const getSourceAndDestChainIds = ({
  bridgeHistoryItem,
}: UseBridgeChainInfoProps) => {
  const hexSrcChainId = bridgeHistoryItem
    ? formatChainIdFromDecimal(bridgeHistoryItem.quote.srcChainId)
    : undefined;
  const hexDestChainId = bridgeHistoryItem
    ? formatChainIdFromDecimal(bridgeHistoryItem.quote.destChainId)
    : undefined;

  return {
    hexSrcChainId,
    hexDestChainId,
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
  const networkConfigurationsByChainId = useSelector(
    getNetworkConfigurationsByChainId,
  );

  if (srcTxMeta?.type !== TransactionType.bridge) {
    return {
      srcNetwork: undefined,
      destNetwork: undefined,
    };
  }

  const { hexSrcChainId, hexDestChainId } = getSourceAndDestChainIds({
    bridgeHistoryItem,
  });

  if (!hexSrcChainId || !hexDestChainId) {
    return {
      srcNetwork: undefined,
      destNetwork: undefined,
    };
  }

  // Source chain info
  const srcNetwork = isCaipChainId(hexSrcChainId)
    ? MULTICHAIN_PROVIDER_CONFIGS[hexSrcChainId]
    : networkConfigurationsByChainId[hexSrcChainId];

  const fallbackSrcNetwork: NetworkConfiguration | undefined = isCaipChainId(
    hexSrcChainId,
  )
    ? undefined
    : {
        chainId: hexSrcChainId,
        name: NETWORK_TO_NAME_MAP[
          hexSrcChainId as keyof typeof NETWORK_TO_NAME_MAP
        ],
        nativeCurrency:
          CHAIN_ID_TO_CURRENCY_SYMBOL_MAP[
            hexSrcChainId as keyof typeof CHAIN_ID_TO_CURRENCY_SYMBOL_MAP
          ],
        defaultBlockExplorerUrlIndex: 0,
        blockExplorerUrls: [
          CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP[hexSrcChainId],
        ],
        defaultRpcEndpointIndex: 0,
        rpcEndpoints: [],
      };

  // Dest chain info
  const destNetwork = isCaipChainId(hexDestChainId)
    ? MULTICHAIN_PROVIDER_CONFIGS[hexDestChainId]
    : networkConfigurationsByChainId[hexDestChainId];

  const fallbackDestNetwork: NetworkConfiguration | undefined = isCaipChainId(
    hexDestChainId,
  )
    ? undefined
    : {
        chainId: hexDestChainId,
        name: NETWORK_TO_NAME_MAP[
          hexDestChainId as keyof typeof NETWORK_TO_NAME_MAP
        ],
        nativeCurrency:
          CHAIN_ID_TO_CURRENCY_SYMBOL_MAP[
            hexDestChainId as keyof typeof CHAIN_ID_TO_CURRENCY_SYMBOL_MAP
          ],
        defaultBlockExplorerUrlIndex: 0,
        blockExplorerUrls: [
          CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP[hexDestChainId],
        ],
        defaultRpcEndpointIndex: 0,
        rpcEndpoints: [],
      };

  return {
    srcNetwork: srcNetwork || fallbackSrcNetwork,
    destNetwork: destNetwork || fallbackDestNetwork,
  };
}
