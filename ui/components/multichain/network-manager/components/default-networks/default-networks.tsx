import { CaipChainId, Hex } from '@metamask/utils';
import React, { memo, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { BtcScope, EthScope, SolScope, TrxScope } from '@metamask/keyring-api';
import {
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  FEATURED_RPCS,
} from '../../../../../../shared/constants/network';
import {
  convertCaipToHexChainId,
  getFilteredFeaturedNetworks,
  getNetworkIcon,
  getRpcDataByChainId,
  sortNetworks,
} from '../../../../../../shared/modules/network.utils';
import { getFeaturedNetworksToAdd } from '../../../../../../shared/modules/config-registry-utils';
import {
  getConfigRegistryNetworks,
  getIsConfigRegistryApiEnabled,
  isConfigRegistryNetworksLoading,
} from '../../../../../selectors/config-registry';
import { getNetworkConfigurationsByChainId } from '../../../../../../shared/modules/selectors/networks';
import {
  AlignItems,
  BlockSize,
  BorderRadius,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import {
  setEnabledAllPopularNetworks,
  hideModal,
  setActiveNetwork,
} from '../../../../../store/actions';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  IconSize,
  Text,
} from '../../../../component-library';
import { NetworkListItem } from '../../../network-list-item';
import { useAdditionalNetworkHandlers } from '../../hooks/useAdditionalNetworkHandlers';
import { useNetworkChangeHandlers } from '../../hooks/useNetworkChangeHandlers';
import { useNetworkItemCallbacks } from '../../hooks/useNetworkItemCallbacks';
import { useNetworkManagerState } from '../../hooks/useNetworkManagerState';
import { AdditionalNetworksInfo } from '../additional-networks-info';
import { getMultichainIsEvm } from '../../../../../selectors/multichain';
import {
  getAllEnabledNetworksForAllNamespaces,
  getSelectedMultichainNetworkConfiguration,
} from '../../../../../selectors/multichain/networks';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  getOrderedNetworksList,
  getMultichainNetworkConfigurationsByChainId,
  getIsMultichainAccountsState2Enabled,
  getSelectedInternalAccount,
  getGasFeesSponsoredNetworkEnabled,
  getUseExternalServices,
} from '../../../../../selectors';
import { getInternalAccountBySelectedAccountGroupAndCaip } from '../../../../../selectors/multichain-accounts/account-tree';
import { selectAdditionalNetworksBlacklistFeatureFlag } from '../../../../../selectors/network-blacklist/network-blacklist';
import { isEvmChainId } from '../../../../../../shared/lib/asset-utils';

const DefaultNetworks = memo(() => {
  const t = useI18nContext();
  const dispatch = useDispatch();

  const orderedNetworksList = useSelector(getOrderedNetworksList);
  const [, evmNetworks] = useSelector(
    getMultichainNetworkConfigurationsByChainId,
  );
  const allEnabledNetworksForAllNamespaces = useSelector(
    getAllEnabledNetworksForAllNamespaces,
  );
  const { getItemCallbacks, hasMultiRpcOptions } = useNetworkItemCallbacks();
  const { handleNetworkChange } = useNetworkChangeHandlers();
  const { handleAdditionalNetworkClick } = useAdditionalNetworkHandlers();

  const isEvmNetworkSelected = useSelector(getMultichainIsEvm);

  const isMultichainAccountsState2Enabled = useSelector(
    getIsMultichainAccountsState2Enabled,
  );

  const useExternalServices = useSelector(getUseExternalServices);

  const currentNetwork = useSelector(getSelectedMultichainNetworkConfiguration);
  const selectedNonEvmChainId =
    !isEvmNetworkSelected && currentNetwork ? currentNetwork.chainId : null;

  const evmAccountGroup = useSelector((state) =>
    getInternalAccountBySelectedAccountGroupAndCaip(state, EthScope.Eoa),
  );

  const enabledChainIds = useSelector(getAllEnabledNetworksForAllNamespaces);

  const selectedAccount = useSelector(getSelectedInternalAccount);

  const solAccountGroup = useSelector((state) =>
    getInternalAccountBySelectedAccountGroupAndCaip(state, SolScope.Mainnet),
  );

  let btcAccountGroup = null;

  ///: BEGIN:ONLY_INCLUDE_IF(bitcoin)
  btcAccountGroup = useSelector((state) =>
    getInternalAccountBySelectedAccountGroupAndCaip(state, BtcScope.Mainnet),
  );
  ///: END:ONLY_INCLUDE_IF

  let trxAccountGroup = null;

  ///: BEGIN:ONLY_INCLUDE_IF(tron)
  trxAccountGroup = useSelector((state) =>
    getInternalAccountBySelectedAccountGroupAndCaip(state, TrxScope.Mainnet),
  );
  ///: END:ONLY_INCLUDE_IF

  const blacklistedChainIds = useSelector(
    selectAdditionalNetworksBlacklistFeatureFlag,
  );

  const isGasFeesSponsoredNetworkEnabled = useSelector(
    getGasFeesSponsoredNetworkEnabled,
  );

  const isNetworkGasSponsored = useCallback(
    (chainId: string | undefined): boolean => {
      if (!chainId) {
        return false;
      }

      return Boolean(
        isGasFeesSponsoredNetworkEnabled?.[
          chainId as keyof typeof isGasFeesSponsoredNetworkEnabled
        ],
      );
    },
    [isGasFeesSponsoredNetworkEnabled],
  );

  const configRegistryNetworks = useSelector(getConfigRegistryNetworks);
  const isConfigRegistryLoading = useSelector(isConfigRegistryNetworksLoading);
  const isConfigRegistryApiEnabled = useSelector(getIsConfigRegistryApiEnabled);
  const existingNetworks = useSelector(getNetworkConfigurationsByChainId);

  const { nonTestNetworks, isNetworkInDefaultNetworkTab } =
    useNetworkManagerState({ showDefaultNetworks: true });

  const orderedNetworks = useMemo(() => {
    const filteredNetworks = useExternalServices
      ? nonTestNetworks
      : Object.fromEntries(
          Object.entries(nonTestNetworks).filter(
            ([, network]) =>
              isEvmChainId(network.chainId as `0x${string}`) ||
              network.chainId === selectedNonEvmChainId,
          ),
        );
    return sortNetworks(filteredNetworks, orderedNetworksList);
  }, [
    nonTestNetworks,
    orderedNetworksList,
    useExternalServices,
    selectedNonEvmChainId,
  ]);

  const featuredNetworksNotYetEnabled = useMemo(() => {
    let availableNetworks: typeof FEATURED_RPCS = [];

    if (
      isConfigRegistryApiEnabled &&
      configRegistryNetworks.length > 0 &&
      !isConfigRegistryLoading
    ) {
      availableNetworks = getFeaturedNetworksToAdd(
        configRegistryNetworks,
        existingNetworks,
      );
    } else {
      availableNetworks = FEATURED_RPCS.filter(
        ({ chainId }) => !evmNetworks[chainId],
      );
    }

    const bftFilteredNetworks = useExternalServices
      ? availableNetworks
      : availableNetworks.filter(({ chainId }) =>
          isEvmChainId(chainId as `0x${string}`),
        );

    const filteredNetworks = getFilteredFeaturedNetworks(
      blacklistedChainIds,
      bftFilteredNetworks,
    );

    return filteredNetworks.sort((a, b) => a.name.localeCompare(b.name));
  }, [
    isConfigRegistryApiEnabled,
    configRegistryNetworks,
    isConfigRegistryLoading,
    existingNetworks,
    evmNetworks,
    blacklistedChainIds,
    useExternalServices,
  ]);

  const isAllPopularNetworksSelected = useMemo(
    () => allEnabledNetworksForAllNamespaces.length > 1,
    [allEnabledNetworksForAllNamespaces],
  );

  const isSingleNetworkSelected = useCallback(
    (hexChainId: Hex) => {
      return (
        !isAllPopularNetworksSelected &&
        allEnabledNetworksForAllNamespaces.length === 1 &&
        allEnabledNetworksForAllNamespaces[0] === hexChainId
      );
    },
    [isAllPopularNetworksSelected, allEnabledNetworksForAllNamespaces],
  );

  const selectAllDefaultNetworks = useCallback(() => {
    const evmNetworksList = orderedNetworks.filter((network) => network.isEvm);

    if (evmNetworksList.length === 0) {
      return;
    }

    const firstEvmChainId = evmNetworksList[0].chainId;
    const { defaultRpcEndpoint } = getRpcDataByChainId(
      firstEvmChainId,
      evmNetworks,
    );
    const finalNetworkClientId = defaultRpcEndpoint.networkClientId;

    dispatch(setEnabledAllPopularNetworks());
    dispatch(hideModal());
    setTimeout(() => {
      dispatch(setActiveNetwork(finalNetworkClientId));
    }, 0);
  }, [dispatch, evmNetworks, orderedNetworks]);

  const handleNetworkChangeCallback = useCallback(
    async (chainId: CaipChainId, isLastRemainingNetwork: boolean) => {
      if (isLastRemainingNetwork) {
        return;
      }

      await handleNetworkChange(chainId);
    },
    [handleNetworkChange],
  );

  const networkListItems = useMemo(() => {
    const getFilteredNetworks = () => {
      if (isMultichainAccountsState2Enabled) {
        return orderedNetworks.filter((network) => {
          if (evmAccountGroup && network.isEvm) {
            return true;
          }
          if (!useExternalServices) {
            return network.chainId === selectedNonEvmChainId;
          }
          if (solAccountGroup && network.chainId === SolScope.Mainnet) {
            return true;
          }
          if (btcAccountGroup && network.chainId === BtcScope.Mainnet) {
            return true;
          }
          if (trxAccountGroup && network.chainId === TrxScope.Mainnet) {
            return true;
          }
          return false;
        });
      }
      return orderedNetworks.filter((network) => {
        if (isEvmNetworkSelected) {
          return network.isEvm;
        }
        if (!useExternalServices) {
          return network.chainId === selectedNonEvmChainId;
        }
        if (selectedAccount.scopes.includes(SolScope.Mainnet)) {
          return network.chainId === SolScope.Mainnet;
        }
        if (selectedAccount.scopes.includes(BtcScope.Mainnet)) {
          return network.chainId === BtcScope.Mainnet;
        }
        if (selectedAccount.scopes.includes(TrxScope.Mainnet)) {
          return network.chainId === TrxScope.Mainnet;
        }
        return false;
      });
    };

    const filteredNetworks = getFilteredNetworks();

    return filteredNetworks.map((network) => {
      const networkChainId = network.chainId;
      const hexChainId = network.isEvm
        ? convertCaipToHexChainId(networkChainId)
        : networkChainId;

      if (!isNetworkInDefaultNetworkTab(network)) {
        return null;
      }

      const { onDelete, onEdit, onDiscoverClick, onRpcSelect } =
        getItemCallbacks(network);
      const iconSrc = getNetworkIcon(network);
      const isSelected = isSingleNetworkSelected(hexChainId as Hex);

      const singleRemainingNetwork = enabledChainIds.length === 1;
      const isLastRemainingNetwork =
        singleRemainingNetwork && enabledChainIds[0] === hexChainId;

      return (
        <NetworkListItem
          key={network.chainId}
          chainId={network.chainId}
          name={network.name}
          iconSrc={iconSrc}
          iconSize={AvatarNetworkSize.Md}
          focus={false}
          rpcEndpoint={
            hasMultiRpcOptions(network)
              ? getRpcDataByChainId(network.chainId, evmNetworks)
                  .defaultRpcEndpoint
              : undefined
          }
          onClick={async () => {
            await handleNetworkChangeCallback(
              network.chainId,
              isLastRemainingNetwork,
            );
            await dispatch(hideModal());
          }}
          onDeleteClick={onDelete}
          onEditClick={onEdit}
          onDiscoverClick={onDiscoverClick}
          onRpcEndpointClick={onRpcSelect}
          selected={isSelected}
        />
      );
    });
  }, [
    orderedNetworks,
    isEvmNetworkSelected,
    isNetworkInDefaultNetworkTab,
    getItemCallbacks,
    isSingleNetworkSelected,
    hasMultiRpcOptions,
    evmNetworks,
    handleNetworkChangeCallback,
    btcAccountGroup,
    solAccountGroup,
    trxAccountGroup,
    isMultichainAccountsState2Enabled,
    evmAccountGroup,
    dispatch,
    selectedAccount,
    enabledChainIds,
    useExternalServices,
    selectedNonEvmChainId,
  ]);

  const additionalNetworkListItems = useMemo(() => {
    return featuredNetworksNotYetEnabled.map((network) => {
      const networkImageUrl =
        CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
          network.chainId as keyof typeof CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP
        ];

      return (
        <Box
          display={Display.Flex}
          alignItems={AlignItems.center}
          justifyContent={JustifyContent.flexStart}
          width={BlockSize.Full}
          onClick={() => handleAdditionalNetworkClick(network)}
          paddingLeft={4}
          paddingRight={4}
          paddingTop={4}
          paddingBottom={4}
          gap={4}
          data-testid="additional-network-item"
          className="network-manager__additional-network-item"
          key={network.chainId}
        >
          <AvatarNetwork
            name={network.name}
            size={AvatarNetworkSize.Md}
            src={networkImageUrl}
            borderRadius={BorderRadius.LG}
          />
          <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
            <Text
              variant={TextVariant.bodyMdMedium}
              color={TextColor.textDefault}
            >
              {network.name}
            </Text>
            {isNetworkGasSponsored(network.chainId) && (
              <Text
                variant={TextVariant.bodySm}
                color={TextColor.textAlternative}
              >
                {t('noNetworkFee')}
              </Text>
            )}
          </Box>
          <ButtonIcon
            size={ButtonIconSize.Md}
            color={IconColor.iconDefault}
            iconName={IconName.Add}
            padding={0}
            marginLeft={'auto'}
            ariaLabel={t('addNetwork')}
          />
        </Box>
      );
    });
  }, [
    featuredNetworksNotYetEnabled,
    handleAdditionalNetworkClick,
    t,
    isNetworkGasSponsored,
  ]);

  return (
    <>
      <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
        {isEvmNetworkSelected || isMultichainAccountsState2Enabled ? (
          <Box
            className="network-manager__all-popular-networks"
            data-testid="network-manager-select-all"
          >
            <NetworkListItem
              name={t('allPopularNetworks')}
              onClick={selectAllDefaultNetworks}
              iconSrc={IconName.Global}
              iconSize={IconSize.Xl}
              selected={isAllPopularNetworksSelected}
              focus={false}
            />
          </Box>
        ) : null}
        {networkListItems}
        {(isEvmNetworkSelected || isMultichainAccountsState2Enabled) && (
          <>
            <AdditionalNetworksInfo />
            {additionalNetworkListItems}
          </>
        )}
      </Box>
    </>
  );
});

DefaultNetworks.displayName = 'DefaultNetworks';

export { DefaultNetworks };
