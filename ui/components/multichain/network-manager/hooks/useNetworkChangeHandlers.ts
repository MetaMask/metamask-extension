import { useCallback, useContext, useState } from 'react';
import { parseCaipChainId, type CaipChainId } from '@metamask/utils';
import { useDispatch, useSelector } from 'react-redux';
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
  setEnabledNetworks,
  setNetworkClientIdForDomain,
  setNextNonce,
  setTokenNetworkFilter,
  showPermittedNetworkToast,
  updateCustomNonce,
} from '../../../../store/actions';
import { FEATURED_NETWORK_CHAIN_IDS } from '../../../../../shared/constants/network';
import {
  getAllChainsToPoll,
  getAllDomains,
  getEnabledNetworksByNamespace,
  getMultichainNetworkConfigurationsByChainId,
  getOriginOfCurrentTab,
  getPermittedEVMAccountsForSelectedTab,
  getPermittedEVMChainsForSelectedTab,
  getPreferences,
  getSelectedMultichainNetworkChainId,
} from '../../../../selectors';
import { useAccountCreationOnNetworkChange } from '../../../../hooks/accounts/useAccountCreationOnNetworkChange';
import { MetaMetricsContext } from '../../../../contexts/metametrics';

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
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);

  const { tokenNetworkFilter } = useSelector(getPreferences);
  const selectedTabOrigin = useSelector(getOriginOfCurrentTab);
  const domains = useSelector(getAllDomains);
  const [multichainNetworks, evmNetworks] = useSelector(
    getMultichainNetworkConfigurationsByChainId,
  );
  const currentChainId = useSelector(getSelectedMultichainNetworkChainId);
  const permittedChainIds = useSelector((state) =>
    getPermittedEVMChainsForSelectedTab(state, selectedTabOrigin),
  );
  const permittedAccountAddresses = useSelector((state) =>
    getPermittedEVMAccountsForSelectedTab(state, selectedTabOrigin),
  );
  const enabledNetworksByNamespace = useSelector(getEnabledNetworksByNamespace);
  const allChainIds = useSelector(getAllChainsToPoll);

  const { hasAnyAccountsInNetwork } = useAccountCreationOnNetworkChange();

  // This value needs to be tracked in case the user changes to a Non EVM
  // network and there is no account created for that network. This will
  // allow the user to add an account for that network.
  const [selectedNonEvmNetwork, setSelectedNonEvmNetwork] =
    useState<CaipChainId>();

  const [actionMode, setActionMode] = useState(ACTION_MODE.LIST);

  const handleEvmNetworkChange = useCallback(
    (chainId: CaipChainId) => {
      const { namespace } = parseCaipChainId(chainId);
      const hexChainId = convertCaipToHexChainId(chainId);
      const { defaultRpcEndpoint } = getRpcDataByChainId(chainId, evmNetworks);
      const finalNetworkClientId = defaultRpcEndpoint.networkClientId;

      dispatch(setActiveNetwork(finalNetworkClientId));

      const isPopularNetwork = FEATURED_NETWORK_CHAIN_IDS.includes(hexChainId);

      const enabledNetworkKeys = Object.keys(enabledNetworksByNamespace ?? {});

      if (!isPopularNetwork) {
        // if custom network is enabled, select the new network and disable the custom network
        dispatch(setEnabledNetworks([hexChainId], namespace));
      } else if (enabledNetworkKeys.includes(hexChainId)) {
        const filteredPopularNetworks = enabledNetworkKeys.filter((key) =>
          FEATURED_NETWORK_CHAIN_IDS.includes(key as `0x${string}`),
        );
        // deselect if selected
        const filteredEnabledNetworks = filteredPopularNetworks.filter(
          (key) => key !== hexChainId,
        );
        dispatch(
          setEnabledNetworks(
            filteredEnabledNetworks as CaipChainId[],
            namespace,
          ),
        );
      } else {
        const filteredPopularNetworks = enabledNetworkKeys.filter((key) =>
          FEATURED_NETWORK_CHAIN_IDS.includes(key as `0x${string}`),
        );
        // multiselect default networks
        dispatch(
          setEnabledNetworks(
            [...filteredPopularNetworks, hexChainId] as CaipChainId[],
            namespace,
          ),
        );
      }

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
      evmNetworks,
      dispatch,
      enabledNetworksByNamespace,
      allChainIds,
      tokenNetworkFilter,
      selectedTabOrigin,
      domains,
      permittedAccountAddresses.length,
      permittedChainIds,
    ],
  );

  const handleNonEvmNetworkChange = useCallback(
    async (chainId: CaipChainId) => {
      const { namespace } = parseCaipChainId(chainId);
      const enabledNetworkKeys = Object.keys(enabledNetworksByNamespace ?? {});

      if (enabledNetworkKeys.includes(chainId)) {
        dispatch(setEnabledNetworks([], namespace));
      } else {
        if (hasAnyAccountsInNetwork(chainId)) {
          dispatch(setActiveNetwork(chainId));
          dispatch(setEnabledNetworks([chainId], namespace));
          return;
        }

        if (enabledNetworkKeys.includes(chainId)) {
          const filteredEnabledNetworks = enabledNetworkKeys.filter(
            (key: string) => key !== chainId,
          );
          dispatch(
            setEnabledNetworks(
              filteredEnabledNetworks as CaipChainId[],
              namespace,
            ),
          );
        } else {
          dispatch(
            setEnabledNetworks(
              [...enabledNetworkKeys, chainId] as CaipChainId[],
              namespace,
            ),
          );
        }
        setActionMode(ACTION_MODE.ADD_NON_EVM_ACCOUNT);
      }
    },
    [enabledNetworksByNamespace, dispatch, hasAnyAccountsInNetwork],
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
