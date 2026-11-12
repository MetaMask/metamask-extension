import React, { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { isEvmAccountType } from '@metamask/keyring-api';
import type { CaipChainId, Hex } from '@metamask/utils';
import {
  ButtonBase,
  ButtonBaseSize,
  FontWeight,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
  twMerge,
} from '@metamask/design-system-react';
import { getUseExternalServices } from '../../../../../selectors';
import { selectAccountSupportsEnabledNetworks } from '../../../../../selectors/assets';
import {
  getAllEnabledNetworksForAllNamespaces,
  getEnabledNetworksByNamespace,
  selectEnabledNetworksAsCaipChainIds,
} from '../../../../../selectors/multichain/networks';
import { getNetworkConfigurationsByChainId } from '../../../../../../shared/lib/selectors/networks';
import { useBoolean } from '../../../../../hooks/useBoolean';
import {
  CHAIN_IDS,
  TEST_CHAINS,
} from '../../../../../../shared/constants/network';
import { isEvmChainId } from '../../../../../../shared/lib/asset-utils';
import {
  setActiveNetwork,
  setEnabledAllPopularNetworks,
  setTokenNetworkFilter,
} from '../../../../../store/actions';
import type { MetaMaskReduxState } from '../../../../../store/store';
import { getMultichainNetwork } from '../../../../../selectors/multichain';
import { useNetworkFilterButtonLabel } from '../../hooks/useNetworkFilterButtonLabel';
import {
  getInternalAccountsFromGroupById,
  getSelectedAccountGroup,
} from '../../../../../selectors/multichain-accounts/account-tree';
import type { MultichainAccountsState } from '../../../../../selectors/multichain-accounts/account-tree.types';
import { useDispatch } from '../../../../../store/hooks';
import { HomeNetworkFilterModal } from './home-network-filter-modal';
import { useAssetControl, useIsControlBarFullScreen } from './asset-controls';

type NetworkFilterProps = {
  onNetworkSelect?: (networks: string[]) => void;
};

/**
 * Network filter button and modal. Owns the effects that keep the enabled
 * network filter in sync, so each mounted filter runs them once.
 *
 * @param props - The component props.
 * @param props.onNetworkSelect - Called with the enabled CAIP chain ids whenever
 * they change. Activity uses this to filter its list.
 */
export const NetworkFilter = ({ onNetworkSelect }: NetworkFilterProps) => {
  const dispatch = useDispatch();
  const isFullScreen = useIsControlBarFullScreen();
  const { isOpen, toggle, close } = useAssetControl('network');
  const useExternalServices = useSelector(getUseExternalServices);
  const currentMultichainNetwork = useSelector(getMultichainNetwork);
  const allNetworks = useSelector(getNetworkConfigurationsByChainId);
  const accountSupportsEnabledNetworks = useSelector(
    selectAccountSupportsEnabledNetworks,
  );
  const selectedAccountGroupAccounts = useSelector(
    (state: MetaMaskReduxState) => {
      const multichainAccountsState =
        state as unknown as MultichainAccountsState;
      const selectedAccountGroup = getSelectedAccountGroup(
        multichainAccountsState,
      );
      return getInternalAccountsFromGroupById(
        multichainAccountsState,
        selectedAccountGroup,
      );
    },
  );
  const isEvmOnlySelectedAccountGroup = useMemo(
    () =>
      selectedAccountGroupAccounts.length > 0 &&
      selectedAccountGroupAccounts.every((account) =>
        isEvmAccountType(account.type),
      ),
    [selectedAccountGroupAccounts],
  );
  const enabledNetworksByNamespace = useSelector(getEnabledNetworksByNamespace);
  const allEnabledNetworksForAllNamespaces = useSelector(
    getAllEnabledNetworksForAllNamespaces,
  );
  const selectedCaipChainIds = useSelector(selectEnabledNetworksAsCaipChainIds);
  const { value: isNetworkSwitchPending, setValue: setIsNetworkSwitchPending } =
    useBoolean();

  const currentNamespaceNetworkCount = Object.keys(
    enabledNetworksByNamespace,
  ).length;
  const totalEnabledNetworkCount = allEnabledNetworksForAllNamespaces.length;
  const isSingleNetworkFilterSelected = totalEnabledNetworkCount === 1;
  const networkButtonText = useNetworkFilterButtonLabel();

  useEffect(() => {
    if (!onNetworkSelect) {
      return;
    }
    onNetworkSelect(selectedCaipChainIds);
  }, [onNetworkSelect, selectedCaipChainIds]);

  const isTestNetwork = useMemo(() => {
    return (TEST_CHAINS as string[]).includes(
      currentMultichainNetwork.network.chainId,
    );
  }, [currentMultichainNetwork.network.chainId]);

  const allOpts: Record<string, boolean> = useMemo(() => {
    const opts: Record<string, boolean> = {};
    Object.keys(allNetworks || {}).forEach((chainId) => {
      opts[chainId] = true;
    });
    return opts;
  }, [allNetworks]);

  useEffect(() => {
    if (isTestNetwork) {
      const testnetFilter = {
        [currentMultichainNetwork.network.chainId]: true,
      };
      dispatch(setTokenNetworkFilter(testnetFilter));
    }
  }, [isTestNetwork, currentMultichainNetwork.network.chainId, dispatch]);

  // TODO: This useEffect should be a migration
  // We need to set the default filter for all users to be all included networks, rather than defaulting to empty object
  // This effect is to unblock and derisk in the short-term
  useEffect(() => {
    if (currentNamespaceNetworkCount === 0) {
      dispatch(setTokenNetworkFilter(allOpts));
    } else {
      dispatch(
        setTokenNetworkFilter({
          [currentMultichainNetwork.network.chainId]: true,
        }),
      );
    }
  }, [
    allOpts,
    currentMultichainNetwork.network.chainId,
    dispatch,
    currentNamespaceNetworkCount,
  ]);

  useEffect(() => {
    if (
      isEvmOnlySelectedAccountGroup &&
      !accountSupportsEnabledNetworks &&
      totalEnabledNetworkCount > 0
    ) {
      dispatch(setEnabledAllPopularNetworks());
    }
  }, [
    accountSupportsEnabledNetworks,
    dispatch,
    isEvmOnlySelectedAccountGroup,
    totalEnabledNetworkCount,
  ]);

  // Basic Functionality hides non-EVM networks from the picker. If one is still
  // the selected filter, move to all popular networks and a default EVM network.
  const shouldSwitchFromHiddenNonEvmNetwork =
    useExternalServices === false &&
    allEnabledNetworksForAllNamespaces.length > 0 &&
    allEnabledNetworksForAllNamespaces.every(
      (chainId) => !isEvmChainId(chainId as CaipChainId | Hex),
    );

  useEffect(() => {
    if (!shouldSwitchFromHiddenNonEvmNetwork) {
      return;
    }

    dispatch(setEnabledAllPopularNetworks());
    const network =
      allNetworks[CHAIN_IDS.MAINNET] ?? Object.values(allNetworks)[0];
    const networkClientId =
      network?.rpcEndpoints[network.defaultRpcEndpointIndex]?.networkClientId;
    if (networkClientId) {
      dispatch(setActiveNetwork(networkClientId));
    }
  }, [allNetworks, dispatch, shouldSwitchFromHiddenNonEvmNetwork]);

  const networkFilterTextColor = isSingleNetworkFilterSelected
    ? TextColor.PrimaryDefault
    : TextColor.TextDefault;

  return (
    <>
      <ButtonBase
        data-testid="sort-by-networks"
        className={twMerge(
          'w-auto min-w-[auto] justify-between gap-1 border border-muted bg-background-default px-2 py-0 hover:bg-hover',
          isFullScreen && 'mr-2',
          isOpen && 'bg-pressed',
          isSingleNetworkFilterSelected && 'text-primary-default',
        )}
        onClick={toggle}
        size={ButtonBaseSize.Sm}
        isLoading={isNetworkSwitchPending}
        isDisabled={isNetworkSwitchPending}
        startIconName={isNetworkSwitchPending ? undefined : IconName.Filter}
        startIconProps={{
          size: IconSize.Md,
          color: isSingleNetworkFilterSelected
            ? IconColor.PrimaryDefault
            : IconColor.IconDefault,
        }}
      >
        <Text
          variant={TextVariant.BodySm}
          fontWeight={FontWeight.Medium}
          color={networkFilterTextColor}
          ellipsis
        >
          {networkButtonText}
        </Text>
      </ButtonBase>
      <HomeNetworkFilterModal
        isOpen={isOpen}
        onClose={close}
        onPendingChange={setIsNetworkSwitchPending}
      />
    </>
  );
};
