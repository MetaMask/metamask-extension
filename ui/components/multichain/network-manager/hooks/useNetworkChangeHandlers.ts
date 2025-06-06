import { useCallback, useState } from 'react';
import { type CaipChainId, type Hex } from '@metamask/utils';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import {
  convertCaipToHexChainId,
  getRpcDataByChainId,
} from '../../../../../shared/modules/network.utils';
import {
  addPermittedChain,
  detectNfts,
  setActiveNetwork,
  setNetworkClientIdForDomain,
  setNextNonce,
  setTokenNetworkFilter,
  showPermittedNetworkToast,
  toggleNetworkMenu,
  updateCustomNonce,
} from '../../../../store/actions';
import { useNetworkManagerState } from './useNetworkManagerState';

export enum ACTION_MODE {
  // Displays the search box and network list
  LIST,
  // Displays the form to add or edit a network
  ADD_EDIT,
  // Displays the page for adding an additional RPC URL
  ADD_RPC,
  // Displays the page for adding an additional explorer URL
  ADD_EXPLORER_URL,
  // Displays the page for selecting an RPC URL
  SELECT_RPC,
  // Add account for non EVM networks
  ADD_NON_EVM_ACCOUNT,
}

export const useNetworkChangeHandlers = () => {
  const {
    dispatch,
    trackEvent,
    hasAnyAccountsInNetwork,
    tokenNetworkFilter,
    selectedTabOrigin,
    domains,
    multichainNetworks,
    evmNetworks,
    currentChainId,
    permittedChainIds,
    permittedAccountAddresses,
    allChainIds,
  } = useNetworkManagerState();

  // This value needs to be tracked in case the user changes to a Non EVM
  // network and there is no account created for that network. This will
  // allow the user to add an account for that network.
  const [selectedNonEvmNetwork, setSelectedNonEvmNetwork] =
    useState<CaipChainId>();

  const [actionMode, setActionMode] = useState(ACTION_MODE.LIST);

  const handleEvmNetworkChange = useCallback(
    (chainId: CaipChainId, networkClientId?: string) => {
      const hexChainId = convertCaipToHexChainId(chainId);
      const { defaultRpcEndpoint } = getRpcDataByChainId(chainId, evmNetworks);
      const finalNetworkClientId =
        networkClientId ?? defaultRpcEndpoint.networkClientId;

      dispatch(setActiveNetwork(finalNetworkClientId));
      dispatch(updateCustomNonce(''));
      dispatch(setNextNonce(''));
      dispatch(detectNfts(allChainIds));

      // as a user, I don't want my network selection to force update my filter
      // when I have "All Networks" toggled on however, if I am already filtered
      // on "Current Network", we'll want to filter by the selected network when
      // the network changes.
      if (Object.keys(tokenNetworkFilter || {}).length <= 1) {
        dispatch(setTokenNetworkFilter({ [hexChainId]: true }));
      } else {
        const allOpts = Object.keys(evmNetworks).reduce((acc, id) => {
          acc[id] = true;
          return acc;
        }, {} as Record<string, boolean>);
        dispatch(setTokenNetworkFilter(allOpts));
      }

      // If presently on a dapp, communicate a change to
      // the dapp via silent switchEthereumChain that the
      // network has changed due to user action
      if (selectedTabOrigin && domains[selectedTabOrigin]) {
        // setActiveNetwork should be called before setNetworkClientIdForDomain
        // to ensure that the isConnected value can be accurately inferred from
        // NetworkController.state.networksMetadata in return value of
        // `metamask_getProviderState` requests and `metamask_chainChanged` events.
        setNetworkClientIdForDomain(selectedTabOrigin, finalNetworkClientId);
      }

      if (permittedAccountAddresses.length > 0) {
        dispatch(addPermittedChain(selectedTabOrigin, chainId));
        if (!permittedChainIds.includes(hexChainId)) {
          dispatch(showPermittedNetworkToast());
        }
      }
    },
    [
      dispatch,
      evmNetworks,
      allChainIds,
      tokenNetworkFilter,
      selectedTabOrigin,
      domains,
      permittedAccountAddresses,
      permittedChainIds,
    ],
  );

  const handleNonEvmNetworkChange = useCallback(
    async (chainId: CaipChainId) => {
      if (hasAnyAccountsInNetwork(chainId)) {
        dispatch(setActiveNetwork(chainId));
        return;
      }

      setSelectedNonEvmNetwork(chainId);
      setActionMode(ACTION_MODE.ADD_NON_EVM_ACCOUNT);
    },
    [hasAnyAccountsInNetwork, dispatch],
  );

  const getMultichainNetworkConfigurationOrThrow = useCallback(
    (chainId: CaipChainId) => {
      const network = multichainNetworks[chainId];
      if (!network) {
        throw new Error(
          `Network configuration not found for chainId: ${chainId}`,
        );
      }
      return network;
    },
    [multichainNetworks],
  );

  const handleNetworkChange = useCallback(
    async (chainId: CaipChainId) => {
      const currentChain =
        getMultichainNetworkConfigurationOrThrow(currentChainId);
      const chain = getMultichainNetworkConfigurationOrThrow(chainId);

      if (chain.isEvm) {
        handleEvmNetworkChange(chainId);
      } else {
        await handleNonEvmNetworkChange(chainId);
      }

      const chainIdToTrack = chain.isEvm
        ? convertCaipToHexChainId(chainId)
        : chainId;
      const currentChainIdToTrack = currentChain.isEvm
        ? convertCaipToHexChainId(currentChainId)
        : currentChainId;

      trackEvent({
        event: MetaMetricsEventName.NavNetworkSwitched,
        category: MetaMetricsEventCategory.Network,
        properties: {
          location: 'Network Menu',
          chain_id: currentChainIdToTrack,
          from_network: currentChainIdToTrack,
          to_network: chainIdToTrack,
        },
      });
    },
    [
      getMultichainNetworkConfigurationOrThrow,
      currentChainId,
      handleEvmNetworkChange,
      handleNonEvmNetworkChange,
      trackEvent,
    ],
  );

  return {
    handleNetworkChange,
    handleEvmNetworkChange,
    handleNonEvmNetworkChange,
    getMultichainNetworkConfigurationOrThrow,
    selectedNonEvmNetwork,
    setSelectedNonEvmNetwork,
    actionMode,
    setActionMode,
    ACTION_MODE,
  };
};