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
import {
  AlignItems,
  BlockSize,
  BorderColor,
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
import { getAllEnabledNetworksForAllNamespaces } from '../../../../../selectors/multichain/networks';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  getOrderedNetworksList,
  getMultichainNetworkConfigurationsByChainId,
  getIsMultichainAccountsState2Enabled,
  getSelectedInternalAccount,
  getGasFeesSponsoredNetworkEnabled,
} from '../../../../../selectors';
import { getInternalAccountBySelectedAccountGroupAndCaip } from '../../../../../selectors/multichain-accounts/account-tree';
import { selectAdditionalNetworksBlacklistFeatureFlag } from '../../../../../selectors/network-blacklist/network-blacklist';

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
  // Use the shared callbacks hook
  const { getItemCallbacks, hasMultiRpcOptions } = useNetworkItemCallbacks();

  // Use the shared network change handlers hook
  const { handleNetworkChange } = useNetworkChangeHandlers();

  // Use the additional network handlers hook
  const { handleAdditionalNetworkClick } = useAdditionalNetworkHandlers();

  const isEvmNetworkSelected = useSelector(getMultichainIsEvm);

  const isMultichainAccountsState2Enabled = useSelector(
    getIsMultichainAccountsState2Enabled,
  );

  // extract the evm account of the selected account group
  const evmAccountGroup = useSelector((state) =>
    getInternalAccountBySelectedAccountGroupAndCaip(state, EthScope.Eoa),
  );

  const enabledChainIds = useSelector(getAllEnabledNetworksForAllNamespaces);

  const selectedAccount = useSelector(getSelectedInternalAccount);

  // extract the solana account of the selected account group
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

  // Get blacklisted chain IDs from feature flag
  const blacklistedChainIds = useSelector(
    selectAdditionalNetworksBlacklistFeatureFlag,
  );

  // This selector provides the indication if the "Gas sponsored" label
  // is enabled based on the remote feature flag.
  const isGasFeesSponsoredNetworkEnabled = useSelector(
    getGasFeesSponsoredNetworkEnabled,
  );

  // Check if a network has gas sponsorship enabled
  const isNetworkGasSponsored = useCallback(
    (chainId: string | undefined): boolean => {
      if (!chainId) return false;

      return Boolean(
        isGasFeesSponsoredNetworkEnabled?.[
          chainId as keyof typeof isGasFeesSponsoredNetworkEnabled
        ]
      );
    },
    [isGasFeesSponsoredNetworkEnabled]
  );

  // Use the shared state hook
  const { nonTestNetworks, isNetworkInDefaultNetworkTab } =
    useNetworkManagerState({ showDefaultNetworks: true });

  // Memoize sorted networks to avoid expensive sorting on every render
  const orderedNetworks = useMemo(
    () => sortNetworks(nonTestNetworks, orderedNetworksList),
    [nonTestNetworks, orderedNetworksList],
  );

  // Memoize the featured networks calculation
  const featuredNetworksNotYetEnabled = useMemo(() => {
    // Filter out networks that are already enabled
    const availableNetworks = FEATURED_RPCS.filter(
      ({ chainId }) => !evmNetworks[chainId],
    );

    // Apply blacklist filter to exclude blacklisted networks
    const filteredNetworks = getFilteredFeaturedNetworks(
      blacklistedChainIds,
      availableNetworks,
    );

    // Sort alphabetically
    return filteredNetworks.sort((a, b) => a.name.localeCompare(b.name));
  }, [evmNetworks, blacklistedChainIds]);

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

  // Use useCallback for stable function references
  const selectAllDefaultNetworks = useCallback(() => {
    const evmNetworksList = orderedNetworks.filter((network) => network.isEvm);

    if (evmNetworksList.length === 0) {
      return;
    }

    // Use the first EVM network's chain ID for getting RPC data
    const firstEvmChainId = evmNetworksList[0].chainId;
    const { defaultRpcEndpoint } = getRpcDataByChainId(
      firstEvmChainId,
      evmNetworks,
    );
    const finalNetworkClientId = defaultRpcEndpoint.networkClientId;

    dispatch(setEnabledAllPopularNetworks());
    dispatch(hideModal());
    // deferring execution to keep select all unblocked
    setTimeout(() => {
      dispatch(setActiveNetwork(finalNetworkClientId));
    }, 0);
  }, [dispatch, evmNetworks, orderedNetworks]);

  // Memoize the network change handler to avoid recreation
  const handleNetworkChangeCallback = useCallback(
    async (chainId: CaipChainId, isLastRemainingNetwork: boolean) => {
      if (isLastRemainingNetwork) {
        return;
      }

      await handleNetworkChange(chainId);
    },
    [handleNetworkChange],
  );

  // Memoize the network list items to avoid recreation on every render
  const networkListItems = useMemo(() => {
    // Helper function to filter networks based on account type and selection
    const getFilteredNetworks = () => {
      if (isMultichainAccountsState2Enabled) {
        return orderedNetworks.filter((network) => {
          // Show EVM networks if user has EVM accounts
          if (evmAccountGroup && network.isEvm) {
            return true;
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
      const networkChainId = network.chainId; // eip155:59144
      // Convert CAIP format to hex format for comparison
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
  ]);

  // Memoize the additional network list items
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
          <Text
            variant={TextVariant.bodyMdMedium}
            color={TextColor.textDefault}
          >
            {network.name}
          </Text>
          {isNetworkGasSponsored(network.chainId) && (
            <Text
              marginLeft={1}
              variant={TextVariant.bodySm}
              color={TextColor.textDefault}
              borderColor={BorderColor.borderDefault}
              paddingLeft={1}
              paddingRight={1}
            >
              {t('noNetworkFee')}
            </Text>
          )}
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
  }, [featuredNetworksNotYetEnabled, handleAdditionalNetworkClick, t, isNetworkGasSponsored]);

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
