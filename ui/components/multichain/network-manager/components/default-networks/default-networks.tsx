import { CaipChainId, parseCaipChainId } from '@metamask/utils';
import React, { memo, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { EthScope } from '@metamask/keyring-api';
import {
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  FEATURED_NETWORK_CHAIN_IDS,
  FEATURED_RPCS,
} from '../../../../../../shared/constants/network';
import {
  convertCaipToHexChainId,
  getNetworkIcon,
  getRpcDataByChainId,
  sortNetworks,
} from '../../../../../../shared/modules/network.utils';
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
  setActiveNetwork,
  setEnabledNetworks,
} from '../../../../../store/actions';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  ButtonIcon,
  ButtonIconSize,
  ButtonLink,
  Checkbox,
  IconName,
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
  getEnabledNetworksByNamespace,
  getSelectedMultichainNetworkChainId,
} from '../../../../../selectors/multichain/networks';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  getOrderedNetworksList,
  getMultichainNetworkConfigurationsByChainId,
  getEnabledNetworks,
  getIsMultichainAccountsState2Enabled,
} from '../../../../../selectors';
import Tooltip from '../../../../ui/tooltip';
import { getInternalAccountBySelectedAccountGroupAndCaip } from '../../../../../selectors/multichain-accounts/account-tree';

const DefaultNetworks = memo(() => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const orderedNetworksList = useSelector(getOrderedNetworksList);
  const [, evmNetworks] = useSelector(
    getMultichainNetworkConfigurationsByChainId,
  );
  const allEnabledNetworks = useSelector(getEnabledNetworks);
  // Use the shared callbacks hook
  const { getItemCallbacks, hasMultiRpcOptions } = useNetworkItemCallbacks();
  const currentCaipChainId = useSelector(getSelectedMultichainNetworkChainId);
  const { namespace } = parseCaipChainId(currentCaipChainId);

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

  // extract the solana account of the selected account group
  const solAccountGroup = useSelector((state) =>
    getInternalAccountBySelectedAccountGroupAndCaip(
      state,
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
    ),
  );

  // extract the bitcoin account of the selected account group
  const btcAccountGroup = useSelector((state) =>
    getInternalAccountBySelectedAccountGroupAndCaip(
      state,
      'bip122:000000000019d6689c085ae165831e93',
    ),
  );

  console.log('btcAccountGroup 2222 ********', btcAccountGroup);

  // Use the shared state hook
  const { nonTestNetworks, isNetworkInDefaultNetworkTab } =
    useNetworkManagerState({ showDefaultNetworks: true });

  // Memoize sorted networks to avoid expensive sorting on every render
  const orderedNetworks = useMemo(
    () => sortNetworks(nonTestNetworks, orderedNetworksList),
    [nonTestNetworks, orderedNetworksList],
  );

  // Memoize the featured networks calculation
  const featuredNetworksNotYetEnabled = useMemo(
    () =>
      FEATURED_RPCS.filter(({ chainId }) => !evmNetworks[chainId]).sort(
        (a, b) => a.name.localeCompare(b.name),
      ),
    [evmNetworks],
  );

  // Use useCallback for stable function references
  const selectAllDefaultNetworks = useCallback(() => {
    const evmNetworksList = orderedNetworks.filter((network) => network.isEvm);

    if (evmNetworksList.length === 0) {
      return;
    }

    const evmChainIds = evmNetworksList
      .map((network) => convertCaipToHexChainId(network.chainId))
      .filter((chainId) => FEATURED_NETWORK_CHAIN_IDS.includes(chainId));

    // Use the first EVM network's chain ID for getting RPC data
    const firstEvmChainId = evmNetworksList[0].chainId;
    const { defaultRpcEndpoint } = getRpcDataByChainId(
      firstEvmChainId,
      evmNetworks,
    );
    const finalNetworkClientId = defaultRpcEndpoint.networkClientId;

    dispatch(setEnabledNetworks(evmChainIds, namespace));
    // deferring execution to keep select all unblocked
    setTimeout(() => {
      dispatch(setActiveNetwork(finalNetworkClientId));
    }, 0);
  }, [dispatch, evmNetworks, namespace, orderedNetworks]);

  const enabledNetworks = useSelector(getEnabledNetworksByNamespace);

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
    const enabledChainIds = Object.keys(enabledNetworks);
    const singleRemainingNetwork = enabledChainIds.length === 1;

    // Helper function to check if a network is enabled
    const isNetworkEnabled = (hexChainId: string): boolean => {
      return Object.values(allEnabledNetworks).some((item) =>
        Object.prototype.hasOwnProperty.call(item, hexChainId),
      );
    };

    // Helper function to filter networks based on account type and selection
    const getFilteredNetworks = () => {
      if (isMultichainAccountsState2Enabled) {
        return orderedNetworks.filter((network) => {
          // Show EVM networks if user has EVM accounts
          if (evmAccountGroup && network.isEvm) {
            return true;
          }
          if (
            solAccountGroup &&
            network.chainId === 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'
          ) {
            console.log('network ********', network);
            return true;
          }
          if (
            btcAccountGroup &&
            network.chainId === 'bip122:000000000019d6689c085ae165831e93'
          ) {
            return true;
          }
          return false;
        });
      }

      return orderedNetworks.filter((network) => {
        // If EVM network is selected, only show EVM networks
        if (isEvmNetworkSelected) {
          return network.isEvm;
        }
        // If non-EVM network is selected, only show non-EVM networks
        return !network.isEvm;
      });
    };

    const filteredNetworks = getFilteredNetworks();

    // Filter out networks that shouldn't be shown in default tab and map to components
    return filteredNetworks
      .filter((network) => isNetworkInDefaultNetworkTab(network))
      .map((network) => {
        const networkChainId = network.chainId; // eip155:59144
        // Convert CAIP format to hex format for comparison
        const hexChainId = network.isEvm
          ? convertCaipToHexChainId(networkChainId)
          : networkChainId;

        const { onDelete, onEdit, onDiscoverClick, onRpcSelect } =
          getItemCallbacks(network);
        const iconSrc = getNetworkIcon(network);
        const isEnabled = isNetworkEnabled(hexChainId);
        const isLastRemainingNetwork =
          singleRemainingNetwork && enabledChainIds[0] === hexChainId;

        // Create checkbox component with conditional tooltip
        const checkboxComponent = isLastRemainingNetwork ? (
          <Tooltip
            title={t('networkManagerMustHaveAtLeastOneNetworkEnabled')}
            position="top"
          >
            <Checkbox label="" isChecked={isEnabled} />
          </Tooltip>
        ) : (
          <Checkbox label="" isChecked={isEnabled} />
        );

        return (
          <NetworkListItem
            startAccessory={checkboxComponent}
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
            onClick={() =>
              handleNetworkChangeCallback(
                network.chainId,
                isLastRemainingNetwork,
              )
            }
            onDeleteClick={onDelete}
            onEditClick={onEdit}
            onDiscoverClick={onDiscoverClick}
            onRpcEndpointClick={onRpcSelect}
          />
        );
      });
  }, [
    enabledNetworks,
    orderedNetworks,
    isMultichainAccountsState2Enabled,
    evmAccountGroup,
    solAccountGroup,
    isEvmNetworkSelected,
    isNetworkInDefaultNetworkTab,
    getItemCallbacks,
    hasMultiRpcOptions,
    evmNetworks,
    handleNetworkChangeCallback,
    allEnabledNetworks,
    t,
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
          <ButtonIcon
            size={ButtonIconSize.Md}
            color={IconColor.iconAlternative}
            iconName={IconName.Add}
            padding={0}
            margin={0}
            ariaLabel={t('addNetwork')}
          />
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
        </Box>
      );
    });
  }, [featuredNetworksNotYetEnabled, handleAdditionalNetworkClick, t]);

  return (
    <>
      <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.flexStart}
          paddingTop={4}
          paddingLeft={4}
        >
          {isEvmNetworkSelected ? (
            <ButtonLink
              onClick={selectAllDefaultNetworks}
              data-testid="network-manager-select-all"
            >
              {t('selectAll')}
            </ButtonLink>
          ) : null}
        </Box>
        {networkListItems}
        {isEvmNetworkSelected && (
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
