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

  const bridgeTxHistory = useSelector(selectBridgeTxHistory);
  const txHash = transactionGroup.initialTransaction.hash;
  const bridgeTxHistoryItem = txHash ? bridgeTxHistory[txHash] : undefined;

  const status = transactionGroup.initialTransaction.status;
  const isPending =
    PENDING_STATUS_HASH[status as keyof typeof PENDING_STATUS_HASH];

  const decDestChainId = bridgeTxHistoryItem?.quote.destChainId;
  const hexDestChainId = decDestChainId
    ? (new Numeric(decDestChainId, 10).toPrefixedHexString() as Hex)
    : undefined;
  const networkConfiguration = hexDestChainId
    ? networkConfigurationsByChainId[hexDestChainId]
    : undefined;
  const chainName = networkConfiguration?.name || 'Unknown';
  const bridgeTitleSuffix = bridgeTxHistoryItem ? ` to ${chainName}` : '';

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

  const showSwitchToDestChain = switchToDestChain && isPending;

  // TODO there's a weird bug with OP src chain where it gets a 500 on the first status tx fetch
  if (isPending) {
    console.log('transactionGroup', {
      transactionGroup,
      bridgeTxHistory,
      bridgeTxHistoryItem,
      decDestChainId,
      hexDestChainId,
      networkConfigurationsByChainId,
      networkConfiguration,
    });
  }

  return {
    bridgeTitleSuffix,
    switchToDestChain,
    showSwitchToDestChain,
  };
}
