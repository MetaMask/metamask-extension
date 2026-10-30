import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { EthScope, isEvmAccountType } from '@metamask/keyring-api';
import { type AddNetworkFields } from '@metamask/network-controller';
import { type MultichainNetworkConfiguration } from '@metamask/multichain-network-controller';
import { type CaipChainId } from '@metamask/utils';
import { FEATURED_RPCS } from '../../../../../../shared/constants/network';
import {
  convertCaipToHexChainId,
  getFilteredFeaturedNetworks,
  getRpcDataByChainId,
  sortNetworks,
} from '../../../../../../shared/lib/network.utils';
import { isEvmChainId } from '../../../../../../shared/lib/asset-utils';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  addNetwork,
  setActiveNetwork,
  setEnabledAllPopularNetworks,
} from '../../../../../store/actions';
import type { MetaMaskReduxState } from '../../../../../store/store';
import {
  getAllEnabledNetworksForAllNamespaces,
  getIsEvmMultichainNetworkSelected,
  getMultichainNetworkConfigurationsByChainId,
} from '../../../../../selectors/multichain/networks';
import {
  getOrderedNetworksList,
  getShouldShowTestNetworks,
  getUseExternalServices,
} from '../../../../../selectors';
import {
  getInternalAccountBySelectedAccountGroupAndCaip,
  getInternalAccountsFromGroupById,
  getSelectedAccountGroup,
} from '../../../../../selectors/multichain-accounts/account-tree';
import type { MultichainAccountsState } from '../../../../../selectors/multichain-accounts/account-tree.types';
import { selectAdditionalNetworksBlacklistFeatureFlag } from '../../../../../selectors/network-blacklist/network-blacklist';
import { useNetworkManagerState } from '../../../../multichain/network-manager/hooks/useNetworkManagerState';
import { useNetworkChangeHandlers } from '../../../../multichain/network-manager/hooks/useNetworkChangeHandlers';
import { useDispatch } from '../../../../../store/hooks';

export const getSelectableChainId = (network: MultichainNetworkConfiguration) =>
  network.isEvm ? convertCaipToHexChainId(network.chainId) : network.chainId;

type UseHomeNetworkFilterOptions = {
  onClose?: () => void;
  onPendingChange?: (isPending: boolean) => void;
};

/**
 * The home network filter: which networks can be chosen, which is selected
 * and the handlers that change the selection.
 *
 * @param options - The hook options.
 * @param options.onClose - Called after a selection or an add.
 * @param options.onPendingChange - Called when a network switch starts or ends.
 */
export const useHomeNetworkFilter = ({
  onClose,
  onPendingChange,
}: UseHomeNetworkFilterOptions = {}) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const orderedNetworksList = useSelector(getOrderedNetworksList);
  const [, evmNetworks] = useSelector(
    getMultichainNetworkConfigurationsByChainId,
  );
  const rawMultichainNetworkConfigurationsByChainId = useSelector(
    (state: MetaMaskReduxState) =>
      state.metamask.multichainNetworkConfigurationsByChainId,
  );
  const enabledNetworks = useSelector(getAllEnabledNetworksForAllNamespaces);
  const isEvmNetworkSelected = useSelector(getIsEvmMultichainNetworkSelected);
  const useExternalServices = useSelector(getUseExternalServices);
  const showTestnets = useSelector(getShouldShowTestNetworks);
  const blacklistedChainIds = useSelector(
    selectAdditionalNetworksBlacklistFeatureFlag,
  );
  const evmAccountGroup = useSelector((state) =>
    getInternalAccountBySelectedAccountGroupAndCaip(state, EthScope.Eoa),
  );
  const isEvmOnlySelectedAccountGroup = useSelector(
    (state: MetaMaskReduxState) => {
      const multichainAccountsState =
        state as unknown as MultichainAccountsState;
      const selectedAccountGroup = getSelectedAccountGroup(
        multichainAccountsState,
      );
      const selectedAccountGroupAccounts = getInternalAccountsFromGroupById(
        multichainAccountsState,
        selectedAccountGroup,
      );

      return (
        selectedAccountGroupAccounts.length > 0 &&
        selectedAccountGroupAccounts.every((account) =>
          isEvmAccountType(account.type),
        )
      );
    },
  );
  const { handleNetworkChange, isPending } = useNetworkChangeHandlers();

  const {
    nonTestNetworks: allDefaultNetworkMap,
    isNetworkInDefaultNetworkTab,
  } = useNetworkManagerState({ showDefaultNetworks: true });
  const { nonTestNetworks: customNetworkMap, testNetworks: testNetworkMap } =
    useNetworkManagerState();

  const allDefaultNetworksForSelectedAccountGroup = useMemo(
    () =>
      isEvmOnlySelectedAccountGroup
        ? {
            ...rawMultichainNetworkConfigurationsByChainId,
            ...allDefaultNetworkMap,
          }
        : allDefaultNetworkMap,
    [
      allDefaultNetworkMap,
      isEvmOnlySelectedAccountGroup,
      rawMultichainNetworkConfigurationsByChainId,
    ],
  );

  const enabledNetworkSet = useMemo(
    () => new Set(enabledNetworks),
    [enabledNetworks],
  );

  const isAllDefaultSelected = enabledNetworks.length > 1;

  const isNetworkSelected = useCallback(
    (network: MultichainNetworkConfiguration) =>
      enabledNetworks.length === 1 &&
      enabledNetworkSet.has(getSelectableChainId(network)),
    [enabledNetworkSet, enabledNetworks.length],
  );

  const isNetworkDisabled = useCallback(
    (network: MultichainNetworkConfiguration) =>
      !network.isEvm && isEvmOnlySelectedAccountGroup,
    [isEvmOnlySelectedAccountGroup],
  );
  const getDisabledTooltip = useCallback(
    (disabled: boolean) =>
      disabled ? t('networkNotSupportedByThisAccount') : undefined,
    [t],
  );

  const defaultNetworks = useMemo(() => {
    return sortNetworks(
      allDefaultNetworksForSelectedAccountGroup,
      orderedNetworksList,
    ).filter((network) => {
      if (!isNetworkInDefaultNetworkTab(network)) {
        return false;
      }

      return network.isEvm ? Boolean(evmAccountGroup) : useExternalServices;
    });
  }, [
    allDefaultNetworksForSelectedAccountGroup,
    evmAccountGroup,
    isNetworkInDefaultNetworkTab,
    orderedNetworksList,
    useExternalServices,
  ]);

  const customNetworks = useMemo(() => {
    return sortNetworks(customNetworkMap, orderedNetworksList).filter(
      (network) => network.isEvm || useExternalServices,
    );
  }, [customNetworkMap, orderedNetworksList, useExternalServices]);

  const testNetworks = useMemo(() => {
    return sortNetworks(testNetworkMap, orderedNetworksList).filter(
      (network) => network.isEvm || useExternalServices,
    );
  }, [orderedNetworksList, testNetworkMap, useExternalServices]);

  // When there are no custom networks and no visible test networks, the default
  // list is the only list, so selecting default networks is equivalent to
  // selecting all networks. Once custom or test networks are visible, the top row
  // specifically selects "All default networks".
  const hasOnlyDefaultNetworks =
    customNetworks.length === 0 && !(showTestnets && testNetworks.length > 0);

  const additionalNetworks = useMemo(() => {
    const availableNetworks = FEATURED_RPCS.filter(
      ({ chainId }) => !evmNetworks[chainId],
    ).filter(
      ({ chainId }) =>
        isEvmChainId(chainId as CaipChainId) || useExternalServices,
    );

    return getFilteredFeaturedNetworks(
      blacklistedChainIds,
      availableNetworks,
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [blacklistedChainIds, evmNetworks, useExternalServices]);

  const handleSelectAllDefaultNetworks = useCallback(() => {
    if (isPending) {
      return;
    }

    dispatch(setEnabledAllPopularNetworks());

    // Popular networks include EVM chains, but enabling them does not change the
    // active network. Coming from a non-EVM network leaves the non-EVM account
    // selected, so the NFT tab stays on the unsupported empty state.
    if (!isEvmNetworkSelected) {
      const firstEvmNetwork = defaultNetworks.find((network) => network.isEvm);
      if (firstEvmNetwork) {
        const hexChainId = convertCaipToHexChainId(firstEvmNetwork.chainId);
        if (evmNetworks[hexChainId]) {
          const { defaultRpcEndpoint } = getRpcDataByChainId(
            firstEvmNetwork.chainId,
            evmNetworks,
          );
          dispatch(setActiveNetwork(defaultRpcEndpoint.networkClientId));
        }
      }
    }

    onClose?.();
  }, [
    defaultNetworks,
    dispatch,
    evmNetworks,
    isEvmNetworkSelected,
    isPending,
    onClose,
  ]);

  const handleSelectNetwork = useCallback(
    async (chainId: CaipChainId) => {
      if (isPending) {
        return;
      }
      onPendingChange?.(true);
      onClose?.();
      try {
        await handleNetworkChange(chainId);
      } finally {
        onPendingChange?.(false);
      }
    },
    [handleNetworkChange, isPending, onClose, onPendingChange],
  );

  const handleAddNetwork = useCallback(
    async (network: AddNetworkFields) => {
      if (isPending) {
        return;
      }
      await dispatch(addNetwork(network));
      onClose?.();
    },
    [dispatch, isPending, onClose],
  );

  return {
    additionalNetworks,
    customNetworks,
    defaultNetworks,
    getDisabledTooltip,
    handleAddNetwork,
    handleSelectAllDefaultNetworks,
    handleSelectNetwork,
    hasOnlyDefaultNetworks,
    isAllDefaultSelected,
    isEvmOnlySelectedAccountGroup,
    isNetworkDisabled,
    isNetworkSelected,
    isPending,
    showTestnets,
    testNetworks,
  };
};
