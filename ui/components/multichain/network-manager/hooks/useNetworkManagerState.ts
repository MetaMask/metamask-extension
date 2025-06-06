import { BUILT_IN_NETWORKS } from '@metamask/controller-utils';
import {
  NON_EVM_TESTNET_IDS,
  type MultichainNetworkConfiguration,
} from '@metamask/multichain-network-controller';
import { Hex } from '@metamask/utils';
import { useCallback, useContext, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { convertCaipToHexChainId } from '../../../../../shared/modules/network.utils';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import { MultichainNetworks } from '../../../../../shared/constants/multichain/networks';
import {
  getCompletedOnboarding,
  getIsUnlocked,
} from '../../../../ducks/metamask/metamask';
import {
  FEATURED_RPCS,
  TEST_CHAINS,
} from '../../../../../shared/constants/network';
import { useAccountCreationOnNetworkChange } from '../../../../hooks/accounts/useAccountCreationOnNetworkChange';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  getAllChainsToPoll,
  getAllDomains,
  getAllEnabledNetworks,
  getEditedNetwork,
  getEnabledNetworks,
  getIsAccessedFromDappConnectedSitePopover,
  getIsAddingNewNetwork,
  getIsMultiRpcOnboarding,
  getMultichainNetworkConfigurationsByChainId,
  getNetworkDiscoverButtonEnabled,
  getOrderedNetworksList,
  getOriginOfCurrentTab,
  getPermittedEVMAccountsForSelectedTab,
  getPermittedEVMChainsForSelectedTab,
  getPreferences,
  getSelectedMultichainNetworkChainId,
  getShowTestNetworks,
} from '../../../../selectors';

export const useNetworkManagerState = ({
  skipNetworkFiltering = false,
}: {
  skipNetworkFiltering?: boolean;
} = {}) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);
  const { hasAnyAccountsInNetwork } = useAccountCreationOnNetworkChange();
  const history = useHistory();

  // Redux selectors
  const { tokenNetworkFilter } = useSelector(getPreferences);
  const showTestnets = useSelector(getShowTestNetworks);
  const selectedTabOrigin = useSelector(getOriginOfCurrentTab);
  const isUnlocked = useSelector(getIsUnlocked);
  const domains = useSelector(getAllDomains);
  const orderedNetworksList = useSelector(getOrderedNetworksList);
  const customNetworks = useSelector(getAllEnabledNetworks);
  const isAddingNewNetwork = useSelector(getIsAddingNewNetwork);
  const isMultiRpcOnboarding = useSelector(getIsMultiRpcOnboarding);
  const isAccessedFromDappConnectedSitePopover = useSelector(
    getIsAccessedFromDappConnectedSitePopover,
  );
  const completedOnboarding = useSelector(getCompletedOnboarding);
  const enabledNetworks = useSelector(getEnabledNetworks);
  const isNetworkDiscoverButtonEnabled = useSelector(
    getNetworkDiscoverButtonEnabled,
  );
  const [multichainNetworks, evmNetworks] = useSelector(
    getMultichainNetworkConfigurationsByChainId,
  );
  const currentChainId = useSelector(getSelectedMultichainNetworkChainId);
  const { chainId: editingChainId, editCompleted } =
    useSelector(getEditedNetwork) ?? {};

  const permittedChainIds = useSelector((state) =>
    getPermittedEVMChainsForSelectedTab(state, selectedTabOrigin),
  );

  const permittedAccountAddresses = useSelector((state) =>
    getPermittedEVMAccountsForSelectedTab(state, selectedTabOrigin),
  );

  const allChainIds = useSelector(getAllChainsToPoll);

  // Derived state
  const canSelectNetwork: boolean =
    !process.env.REMOVE_GNS ||
    (Boolean(process.env.REMOVE_GNS) &&
      Boolean(selectedTabOrigin) &&
      Boolean(domains[selectedTabOrigin]) &&
      isAccessedFromDappConnectedSitePopover);

  const [nonTestNetworks, testNetworks] = useMemo(
    () =>
      Object.entries(multichainNetworks).reduce(
        ([nonTestnetsList, testnetsList], [id, network]) => {
          let chainId = id;
          let isTest = false;

          if (network.isEvm) {
            // We keep using raw chain ID for EVM.
            chainId = convertCaipToHexChainId(network.chainId);
            isTest = TEST_CHAINS.includes(chainId as Hex);
          } else {
            isTest = NON_EVM_TESTNET_IDS.includes(network.chainId);
          }

          if (skipNetworkFiltering) {
            (isTest ? testnetsList : nonTestnetsList)[chainId] = network;
            return [nonTestnetsList, testnetsList];
          }

          // Pre-filter to only include networks that are NOT in built-in networks or featured RPCs
          const hexChainId = network.isEvm
            ? convertCaipToHexChainId(network.chainId)
            : network.chainId;

          // Check if the network is NOT a built-in network or featured RPC
          const isBuiltInNetwork = Object.values(BUILT_IN_NETWORKS).some(
            (builtInNetwork) => builtInNetwork.chainId === hexChainId,
          );
          const isFeaturedRpc = FEATURED_RPCS.some(
            (featuredRpc) => featuredRpc.chainId === hexChainId,
          );

          const isMultichainProviderConfig = Object.values(
            MultichainNetworks,
          ).some(
            (multichainNetwork) =>
              multichainNetwork === network.chainId ||
              (network.isEvm
                ? convertCaipToHexChainId(network.chainId)
                : network.chainId) === multichainNetwork,
          );

          const shouldInclude =
            !isBuiltInNetwork && !isFeaturedRpc && !isMultichainProviderConfig;

          if (shouldInclude || isTest) {
            (isTest ? testnetsList : nonTestnetsList)[chainId] = network;
          }

          return [nonTestnetsList, testnetsList];
        },
        [
          {} as Record<string, MultichainNetworkConfiguration>,
          {} as Record<string, MultichainNetworkConfiguration>,
        ],
      ),
    [multichainNetworks],
  );

  const isNetworkInDefaultNetworkTab = useCallback((network: MultichainNetworkConfiguration) => {
    const networkChainId = network.chainId; // eip155:59144
    // Convert CAIP format to hex format for comparison
    const hexChainId = network.isEvm
      ? convertCaipToHexChainId(networkChainId)
      : networkChainId;

    // Only show networks if they are built-in networks or featured RPCs
    const isBuiltInNetwork = Object.values(BUILT_IN_NETWORKS).some(
      (builtInNetwork) => builtInNetwork.chainId === hexChainId,
    );

    const isFeaturedRpc = FEATURED_RPCS.some(
      (featuredRpc) => featuredRpc.chainId === hexChainId,
    );

    const isMultichainProviderConfig = Object.values(MultichainNetworks).some(
      (multichainNetwork) =>
        multichainNetwork === networkChainId ||
        multichainNetwork === hexChainId,
    );

    return !(isBuiltInNetwork && isFeaturedRpc && isMultichainProviderConfig);
  }, []);



  return {
    t,
    dispatch,
    trackEvent,
    hasAnyAccountsInNetwork,
    history,
    isNetworkInDefaultNetworkTab,

    // Selectors
    tokenNetworkFilter,
    showTestnets,
    selectedTabOrigin,
    isUnlocked,
    domains,
    orderedNetworksList,
    customNetworks,
    isAddingNewNetwork,
    isMultiRpcOnboarding,
    isAccessedFromDappConnectedSitePopover,
    completedOnboarding,
    isNetworkDiscoverButtonEnabled,
    multichainNetworks,
    evmNetworks,
    currentChainId,
    enabledNetworks,
    editingChainId,
    editCompleted,
    permittedChainIds,
    permittedAccountAddresses,
    allChainIds,
    nonTestNetworks,
    testNetworks,
    // Derived state
    canSelectNetwork,
  };
};
