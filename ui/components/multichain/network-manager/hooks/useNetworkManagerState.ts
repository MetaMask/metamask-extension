import { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import { useAccountCreationOnNetworkChange } from '../../../../hooks/accounts/useAccountCreationOnNetworkChange';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  getCompletedOnboarding,
  getIsUnlocked,
} from '../../../../ducks/metamask/metamask';
import {
  getAllChainsToPoll,
  getAllDomains,
  getAllEnabledNetworks,
  getEditedNetwork,
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

export const useNetworkManagerState = () => {
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

  return {
    // Hooks
    t,
    dispatch,
    trackEvent,
    hasAnyAccountsInNetwork,
    history,

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
    editingChainId,
    editCompleted,
    permittedChainIds,
    permittedAccountAddresses,
    allChainIds,

    // Derived state
    canSelectNetwork,
  };
};
