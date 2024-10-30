import { useSelector } from 'react-redux';
import { Hex } from '@metamask/utils';
import { Numeric } from '../../../../shared/modules/Numeric';
import { getNetworkConfigurationsByChainId } from '../../../selectors';
import { BridgeHistoryItem } from '../../../../app/scripts/controllers/bridge-status/types';

export type UseBridgeChainInfoProps = {
  bridgeHistoryItem?: BridgeHistoryItem;
};

export default function useBridgeChainInfo({
  bridgeHistoryItem,
}: UseBridgeChainInfoProps) {
  const networkConfigurationsByChainId = useSelector(
    getNetworkConfigurationsByChainId,
  );

  if (!bridgeHistoryItem) {
    return {
      srcNetworkConfiguration: undefined,
      destNetworkConfiguration: undefined,
    };
  }

  const decSrcChainId = bridgeHistoryItem?.quote.srcChainId;
  const hexSrcChainId = decSrcChainId
    ? (new Numeric(decSrcChainId, 10).toPrefixedHexString() as Hex)
    : undefined;

  const decDestChainId = bridgeHistoryItem?.quote.destChainId;
  const hexDestChainId = decDestChainId
    ? (new Numeric(decDestChainId, 10).toPrefixedHexString() as Hex)
    : undefined;

  // Source chain info
  const srcNetworkConfiguration = hexSrcChainId
    ? networkConfigurationsByChainId[hexSrcChainId]
    : undefined;

  // Dest chain info
  const destNetworkConfiguration = hexDestChainId
    ? networkConfigurationsByChainId[hexDestChainId]
    : undefined;

  return {
    srcNetworkConfiguration,
    destNetworkConfiguration,
  };
}
