import { CaipChainId, parseCaipChainId } from '@metamask/utils';
import React, { memo, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
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
import { setEnabledNetworks } from '../../../../../store/actions';
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
} from '../../../../../selectors';

const DefaultNetworks = memo(() => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const orderedNetworksList = useSelector(getOrderedNetworksList);
  const [, evmNetworks] = useSelector(
    getMultichainNetworkConfigurationsByChainId,
  );
  const enabledNetworksByNamespace = useSelector(getEnabledNetworksByNamespace);
  // Use the shared callbacks hook
  const { getItemCallbacks, hasMultiRpcOptions } = useNetworkItemCallbacks();
  const currentCaipChainId = useSelector(getSelectedMultichainNetworkChainId);
  const { namespace } = parseCaipChainId(currentCaipChainId);

  // Use the shared network change handlers hook
  const { handleNetworkChange } = useNetworkChangeHandlers();

  // Use the additional network handlers hook
  const { handleAdditionalNetworkClick } = useAdditionalNetworkHandlers();

  const isEvmNetworkSelected = useSelector(getMultichainIsEvm);

  // Use the shared state hook
  const { nonTestNetworks, isNetworkInDefaultNetworkTab } =
    useNetworkManagerState({ showDefaultNetworks: true });

  // Memoize sorted networks to avoid expensive sorting on every render
  const orderedNetworks = useMemo(
    () => sortNetworks(nonTestNetworks, orderedNetworksList),
    [nonTestNetworks, orderedNetworksList],
  );

  // Memoize the all networks selected calculation
  const allNetworksSelected = useMemo(() => {
    return (
      Object.keys(enabledNetworksByNamespace).length === orderedNetworks.length
    );
  }, [enabledNetworksByNamespace, orderedNetworks.length]);

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
    const evmChainIds = orderedNetworks
      .filter((network) => network.isEvm)
      .map(
        (network) => convertCaipToHexChainId(network.chainId) as CaipChainId,
      );
    dispatch(setEnabledNetworks(evmChainIds, namespace));
  }, [dispatch, namespace, orderedNetworks]);

  const deselectAllDefaultNetworks = useCallback(() => {
    dispatch(setEnabledNetworks([], namespace));
  }, [dispatch, namespace]);

  // Memoize the network change handler to avoid recreation
  const handleNetworkChangeCallback = useCallback(
    async (chainId: CaipChainId) => {
      await handleNetworkChange(chainId);
    },
    [handleNetworkChange],
  );

  // Memoize the network list items to avoid recreation on every render
  const networkListItems = useMemo(() => {
    return orderedNetworks
      .filter((network) => {
        // If EVM network is selected, only show EVM networks
        if (isEvmNetworkSelected) {
          return network.isEvm;
        }
        // If non-EVM network is selected, only show non-EVM networks
        return !network.isEvm;
      })
      .map((network) => {
        const networkChainId = network.chainId; // eip155:59144
        // Convert CAIP format to hex format for comparison
        const hexChainId = network.isEvm
          ? convertCaipToHexChainId(networkChainId)
          : networkChainId;

        if (!isNetworkInDefaultNetworkTab(network)) {
          return null;
        }

        const { onDelete, onEdit, onDiscoverClick, onRpcConfigEdit } =
          getItemCallbacks(network);
        const iconSrc = getNetworkIcon(network);
        const isEnabled = Object.keys(enabledNetworksByNamespace).includes(
          hexChainId,
        );

        return (
          <NetworkListItem
            startAccessory={<Checkbox label="" isChecked={isEnabled} />}
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
            onClick={() => handleNetworkChangeCallback(network.chainId)}
            onDeleteClick={onDelete}
            onEditClick={onEdit}
            onDiscoverClick={onDiscoverClick}
            onRpcEndpointClick={onRpcConfigEdit}
          />
        );
      });
  }, [
    orderedNetworks,
    isEvmNetworkSelected,
    isNetworkInDefaultNetworkTab,
    getItemCallbacks,
    enabledNetworksByNamespace,
    hasMultiRpcOptions,
    evmNetworks,
    handleNetworkChangeCallback,
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
          {allNetworksSelected ? (
            <ButtonLink onClick={deselectAllDefaultNetworks}>
              {t('deselectAll')}
            </ButtonLink>
          ) : (
            <ButtonLink onClick={selectAllDefaultNetworks}>
              {t('selectAll')}
            </ButtonLink>
          )}
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
