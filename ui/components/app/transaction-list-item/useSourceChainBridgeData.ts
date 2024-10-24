import { useSelector, useDispatch } from 'react-redux';
import { Numeric } from '../../../../shared/modules/Numeric';
import { selectBridgeTxHistory } from '../../../ducks/bridge-status/selectors';
import {
  getNetworkConfigurationsByChainId,
  getOriginOfCurrentTab,
  getPermittedAccountsForSelectedTab,
} from '../../../selectors';
import { Hex } from '@metamask/utils';
import { TransactionMeta } from '@metamask/transaction-controller';
import { useCallback, useContext } from 'react';
import {
  setActiveNetwork,
  setNextNonce,
  updateCustomNonce,
} from '../../../store/actions';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { PENDING_STATUS_HASH } from '../../../helpers/constants/transactions';

export default function useSourceChainBridgeData({
  transactionGroup,
}: {
  transactionGroup: {
    hasCancelled: boolean;
    hasRetried: boolean;
    initialTransaction: TransactionMeta;
    nonce: Hex;
    primaryTransaction: TransactionMeta;
    transactions: TransactionMeta[];
  };
}) {
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);
  const selectedTabOrigin = useSelector(getOriginOfCurrentTab);
  const permittedAccountAddresses = useSelector((state) =>
    getPermittedAccountsForSelectedTab(state, selectedTabOrigin),
  );
  const networkConfigurationsByChainId = useSelector(
    getNetworkConfigurationsByChainId,
  );

  const bridgeHistory = useSelector(selectBridgeTxHistory);
  const txHash = transactionGroup.initialTransaction.hash;

  // If this tx is a bridge tx, it will have a bridgeHistoryItem
  const bridgeHistoryItem = txHash ? bridgeHistory[txHash] : undefined;

  const decDestChainId = bridgeHistoryItem?.quote.destChainId;
  const hexDestChainId = decDestChainId
    ? (new Numeric(decDestChainId, 10).toPrefixedHexString() as Hex)
    : undefined;
  const networkConfiguration = hexDestChainId
    ? networkConfigurationsByChainId[hexDestChainId]
    : undefined;
  const chainName = networkConfiguration?.name || 'Unknown';
  const bridgeTitleSuffix = bridgeHistoryItem ? ` to ${chainName}` : '';

  // Most logic from ui/components/multichain/network-list-menu/network-list-menu.tsx
  const switchToDestChainCallback = useCallback(() => {
    if (!networkConfiguration) return;

    const { networkClientId } =
      networkConfiguration.rpcEndpoints[
        networkConfiguration.defaultRpcEndpointIndex
      ];
    dispatch(setActiveNetwork(networkClientId));
    dispatch(updateCustomNonce(''));
    dispatch(setNextNonce(''));

    // if (permittedAccountAddresses.length > 0) {
    //   grantPermittedChain(selectedTabOrigin, network.chainId);
    //   if (!permittedChainIds.includes(network.chainId)) {
    //     dispatch(showPermittedNetworkToast());
    //   }
    // }
    // If presently on a dapp, communicate a change to
    // the dapp via silent switchEthereumChain that the
    // network has changed due to user action
    // if (useRequestQueue && selectedTabOrigin && domains[selectedTabOrigin]) {
    //   setNetworkClientIdForDomain(selectedTabOrigin, networkClientId);
    // }

    // trackEvent({
    //   event: MetaMetricsEventName.NavNetworkSwitched,
    //   category: MetaMetricsEventCategory.Network,
    //   properties: {
    //     location: 'Network Menu',
    //     chain_id: currentChainId,
    //     from_network: currentChainId,
    //     to_network: network.chainId,
    //   },
    // });
  }, [hexDestChainId]);

  const switchToDestChain = networkConfiguration
    ? switchToDestChainCallback
    : undefined;

  // By complete, this means BOTH source and dest tx are confirmed
  const isBridgeComplete = bridgeHistoryItem
    ? Boolean(
        bridgeHistoryItem &&
          bridgeHistoryItem.status &&
          bridgeHistoryItem.status.srcChain.txHash &&
          bridgeHistoryItem.status.destChain?.txHash,
      )
    : null;

  const showSwitchToDestChain = switchToDestChain && !isBridgeComplete;

  if (bridgeHistoryItem && isBridgeComplete === false) {
    let logTitle;
    if (bridgeHistoryItem?.status) {
      logTitle =
        'transactionGroup BRIDGE STATUS' +
        transactionGroup.initialTransaction.hash;
    } else {
      logTitle = 'transactionGroup' + transactionGroup.initialTransaction.hash;
    }
    console.log(logTitle, {
      transactionGroup,
      bridgeTxHistory: bridgeHistory,
      bridgeTxHistoryItem: bridgeHistoryItem,
      decDestChainId,
      hexDestChainId,
      networkConfigurationsByChainId,
      networkConfiguration,
      isBridgeComplete,
    });
  }

  return {
    bridgeTitleSuffix,
    switchToDestChain,
    showSwitchToDestChain,
    bridgeTxHistoryItem: bridgeHistoryItem,
    isBridgeComplete,
  };
}
