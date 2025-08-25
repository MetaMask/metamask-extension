import { useCallback, useContext, useEffect, useState } from 'react';
import { parseCaipChainId, type CaipChainId } from '@metamask/utils';
import { useDispatch, useSelector } from 'react-redux';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import { convertCaipToHexChainId } from '../../../../../shared/modules/network.utils';
import {
  detectNfts,
  setActiveNetwork,
  setEnabledNetworks,
  setNextNonce,
  updateCustomNonce,
} from '../../../../store/actions';
import { FEATURED_NETWORK_CHAIN_IDS } from '../../../../../shared/constants/network';
import {
  getAllChainsToPoll,
  getEnabledNetworksByNamespace,
  getMultichainNetworkConfigurationsByChainId,
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

  const [multichainNetworks] = useSelector(
    getMultichainNetworkConfigurationsByChainId,
  );
  const currentChainId = useSelector(getSelectedMultichainNetworkChainId);

  const enabledNetworksByNamespace = useSelector(getEnabledNetworksByNamespace);
  const allChainIds = useSelector(getAllChainsToPoll);

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
      const hexChainId = convertCaipToHexChainId(chainId);

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
    },
    [dispatch, enabledNetworksByNamespace],
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
