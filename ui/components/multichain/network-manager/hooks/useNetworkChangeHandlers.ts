import { useCallback, useContext, useEffect, useState } from 'react';
import {
  KnownCaipNamespace,
  parseCaipChainId,
  type CaipChainId,
} from '@metamask/utils';
import { useDispatch, useSelector } from 'react-redux';
import { formatChainIdToCaip } from '@metamask/bridge-controller';
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
  showPermittedNetworkToast,
  updateCustomNonce,
} from '../../../../store/actions';
import { FEATURED_NETWORK_CHAIN_IDS_MULTICHAIN } from '../../../../../shared/constants/network';
import {
  getAllChainsToPoll,
  getAllDomains,
  getAllEnabledNetworksUsed,
  getEnabledNetworksByNamespace,
  getIsMultichainAccountsState2Enabled,
  getMultichainNetworkConfigurationsByChainId,
  getOriginOfCurrentTab,
  getPermittedEVMAccountsForSelectedTab,
  getPermittedEVMChainsForSelectedTab,
  getSelectedMultichainNetworkChainId,
} from '../../../../selectors';
import { MetaMetricsContext } from '../../../../contexts/metametrics';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export enum ACTION_MODE {
  // Displays the search box and network list
  LIST,
  // Displays the form to add or edit a network
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  ADD_EDIT,
  // Displays the page for adding an additional RPC URL
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  ADD_RPC,
  // Displays the page for adding an additional explorer URL
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  ADD_EXPLORER_URL,
  // Displays the page for selecting an RPC URL
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  SELECT_RPC,
  // Add account for non EVM networks
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  ADD_NON_EVM_ACCOUNT,
}

export const useNetworkChangeHandlers = () => {
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);

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
  const enabledNetworks = useSelector(getAllEnabledNetworksUsed);
  const allChainIds = useSelector(getAllChainsToPoll);

  const isMultichainAccountsState2Enabled = useSelector(
    getIsMultichainAccountsState2Enabled,
  );

  // This value needs to be tracked in case the user changes to a Non EVM
  // network and there is no account created for that network. This will
  // allow the user to add an account for that network.
  const [selectedNonEvmNetwork, setSelectedNonEvmNetwork] =
    useState<CaipChainId>();

  const [actionMode, setActionMode] = useState(ACTION_MODE.LIST);

  useEffect(() => {
    // Fire and forget async operations for better performance
    // setTimeout with 0 delay pushes these operations to the next event loop tick,
    // preventing them from blocking the current execution stack and improving UI responsiveness.
    // This technique is called "yielding to the event loop" - it allows higher priority
    // tasks (like UI updates) to execute first before these background operations run.
    setTimeout(() => {
      dispatch(updateCustomNonce(''));
      dispatch(setNextNonce(''));
      dispatch(detectNfts(allChainIds));
    }, 0);
  }, [enabledNetworksByNamespace, dispatch, allChainIds]);

  const handleEvmNetworkChange = useCallback(
    (chainId: CaipChainId) => {
      const { namespace } = parseCaipChainId(chainId);
      const hexChainId =
        namespace === KnownCaipNamespace.Eip155
          ? convertCaipToHexChainId(chainId)
          : chainId;

      let finalNetworkClientId;

      if (namespace === KnownCaipNamespace.Eip155) {
        const { defaultRpcEndpoint } = getRpcDataByChainId(
          chainId,
          evmNetworks,
        );
        finalNetworkClientId = defaultRpcEndpoint.networkClientId;
      }

      const isPopularNetwork =
        FEATURED_NETWORK_CHAIN_IDS_MULTICHAIN.includes(hexChainId);

      const enabledNetworkKeys = isMultichainAccountsState2Enabled
        ? enabledNetworks
        : Object.keys(enabledNetworksByNamespace ?? {});

      if (!isPopularNetwork) {
        // if custom network is enabled, select the new network and disable the custom network
        dispatch(setEnabledNetworks([hexChainId], namespace));
      } else if (enabledNetworkKeys.includes(hexChainId)) {
        const filteredPopularNetworks = enabledNetworkKeys.filter((key) =>
          FEATURED_NETWORK_CHAIN_IDS_MULTICHAIN.includes(key as `0x${string}`),
        );

        // deselect if selected
        const filteredEnabledNetworks = filteredPopularNetworks.filter(
          (key) => key !== hexChainId,
        );

        // filter based on namespace
        const networkToEnable = filteredEnabledNetworks.filter((key) => {
          const caipChainId = formatChainIdToCaip(key);

          const { namespace: namespaceToEnable } =
            parseCaipChainId(caipChainId);

          return namespaceToEnable === namespace;
        });

        dispatch(
          setEnabledNetworks(networkToEnable as CaipChainId[], namespace),
        );
      } else {
        const filteredPopularNetworks = enabledNetworkKeys.filter((key) =>
          FEATURED_NETWORK_CHAIN_IDS_MULTICHAIN.includes(key as `0x${string}`),
        );

        // filter based on namespace
        const networkToEnable = filteredPopularNetworks.filter((key) => {
          const caipChainId = formatChainIdToCaip(key);

          const { namespace: namespaceToEnable } =
            parseCaipChainId(caipChainId);

          return namespaceToEnable === namespace;
        });

        // multiselect default networks
        dispatch(
          setEnabledNetworks(
            [...networkToEnable, hexChainId] as CaipChainId[],
            namespace,
          ),
        );
      }

      // If presently on a dapp, communicate a change to
      // the dapp via silent switchEthereumChain that the
      // network has changed due to user action
      if (
        selectedTabOrigin &&
        domains[selectedTabOrigin] &&
        namespace === KnownCaipNamespace.Eip155 &&
        finalNetworkClientId
      ) {
        // setActiveNetwork should be called before setNetworkClientIdForDomain
        // to ensure that the isConnected value can be accurately inferred from
        // NetworkController.state.networksMetadata in return value of
        // `metamask_getProviderState` requests and `metamask_chainChanged` events.
        setNetworkClientIdForDomain(selectedTabOrigin, finalNetworkClientId);
      }

      if (
        permittedAccountAddresses.length > 0 &&
        namespace === KnownCaipNamespace.Eip155
      ) {
        dispatch(addPermittedChain(selectedTabOrigin, chainId));
        if (!permittedChainIds.includes(hexChainId as `0x${string}`)) {
          dispatch(showPermittedNetworkToast());
        }
      }
    },
    [
      evmNetworks,
      dispatch,
      enabledNetworksByNamespace,
      selectedTabOrigin,
      domains,
      permittedAccountAddresses.length,
      permittedChainIds,
    ],
  );

  const handleNonEvmNetworkChange = useCallback(
    async (chainId: CaipChainId) => {
      const { namespace } = parseCaipChainId(chainId);
      dispatch(setActiveNetwork(chainId));
      dispatch(setEnabledNetworks([chainId], namespace));
    },
    [dispatch],
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

      if (chain.isEvm || isMultichainAccountsState2Enabled) {
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
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id: currentChainIdToTrack,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          from_network: currentChainIdToTrack,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
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
