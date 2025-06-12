import { useCallback, useState } from 'react';
import { isHexString, type CaipChainId } from '@metamask/utils';
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
    enabledNetworks,
    allChainIds,
  } = useNetworkManagerState();

  // This value needs to be tracked in case the user changes to a Non EVM
  // network and there is no account created for that network. This will
  // allow the user to add an account for that network.
  const [selectedNonEvmNetwork, setSelectedNonEvmNetwork] =
    useState<CaipChainId>();

  const [actionMode, setActionMode] = useState(ACTION_MODE.LIST);

  const handleEvmNetworkChange = useCallback(
    (
      chainId: CaipChainId,
      {
        overrideEnabledNetworks = false,
      }: { overrideEnabledNetworks?: boolean } = {},
    ) => {
      const hexChainId = convertCaipToHexChainId(chainId);
      const { defaultRpcEndpoint } = getRpcDataByChainId(chainId, evmNetworks);
      const finalNetworkClientId = defaultRpcEndpoint.networkClientId;

      dispatch(setActiveNetwork(finalNetworkClientId));

      const enabledNetworkKeys = Object.keys(enabledNetworks).filter((key) =>
        isHexString(key),
      );

      if (overrideEnabledNetworks) {
        dispatch(setEnabledNetworks([hexChainId] as CaipChainId[]));
      } else if (enabledNetworkKeys.includes(hexChainId)) {
        const filteredEnabledNetworks = enabledNetworkKeys.filter(
          (key) => key !== hexChainId,
        );
        dispatch(setEnabledNetworks(filteredEnabledNetworks as CaipChainId[]));
      } else {
        dispatch(
          setEnabledNetworks([
            ...enabledNetworkKeys,
            hexChainId,
          ] as CaipChainId[]),
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
      enabledNetworks,
      allChainIds,
      tokenNetworkFilter,
      selectedTabOrigin,
      domains,
      permittedAccountAddresses.length,
      permittedChainIds,
    ],
  );

  const handleNonEvmNetworkChange = useCallback(
    async (
      chainId: CaipChainId,
      {
        overrideEnabledNetworks = false,
      }: { overrideEnabledNetworks?: boolean } = {},
    ) => {
      const enabledNetworkKeys = Object.keys(enabledNetworks);

      if (enabledNetworkKeys.includes(chainId)) {
        dispatch(setEnabledNetworks([]));
      } else {
        if (hasAnyAccountsInNetwork(chainId)) {
          dispatch(setActiveNetwork(chainId));
          dispatch(setEnabledNetworks([chainId]));
          return;
        }

        if (overrideEnabledNetworks) {
          dispatch(setEnabledNetworks([chainId] as CaipChainId[]));
        } else if (enabledNetworkKeys.includes(chainId)) {
          const filteredEnabledNetworks = enabledNetworkKeys.filter(
            (key: string) => key !== chainId,
          );
          dispatch(
            setEnabledNetworks(filteredEnabledNetworks as CaipChainId[]),
          );
        } else {
          dispatch(
            setEnabledNetworks([
              ...enabledNetworkKeys,
              chainId,
            ] as CaipChainId[]),
          );
        }
        setActionMode(ACTION_MODE.ADD_NON_EVM_ACCOUNT);
      }
    },
    [enabledNetworks, dispatch, hasAnyAccountsInNetwork],
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
    async (
      chainId: CaipChainId,
      {
        overrideEnabledNetworks = false,
      }: { overrideEnabledNetworks?: boolean } = {},
    ) => {
      const currentChain =
        getMultichainNetworkConfigurationOrThrow(currentChainId);
      const chain = getMultichainNetworkConfigurationOrThrow(chainId);

      if (chain.isEvm) {
        handleEvmNetworkChange(chainId, { overrideEnabledNetworks });
      } else {
        await handleNonEvmNetworkChange(chainId, { overrideEnabledNetworks });
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
