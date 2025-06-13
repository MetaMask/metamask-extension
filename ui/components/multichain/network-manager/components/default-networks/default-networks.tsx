import { CaipChainId } from '@metamask/utils';
import React, { memo, useCallback, useMemo } from 'react';
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

const DefaultNetworks = memo(() => {
  // Use the shared state hook
  const {
    t,
    dispatch,
    orderedNetworksList,
    evmNetworks,
    nonTestNetworks,
    enabledNetworks,
    isNetworkInDefaultNetworkTab,
  } = useNetworkManagerState({ skipNetworkFiltering: true });
  // Use the shared callbacks hook
  const { getItemCallbacks, hasMultiRpcOptions } = useNetworkItemCallbacks();

  // Use the shared network change handlers hook
  const { handleNetworkChange } = useNetworkChangeHandlers();

  // Use the additional network handlers hook
  const { handleAdditionalNetworkClick } = useAdditionalNetworkHandlers();

  // Memoize sorted networks to avoid expensive sorting on every render
  const orderedNetworks = useMemo(
    () => sortNetworks(nonTestNetworks, orderedNetworksList),
    [nonTestNetworks, orderedNetworksList],
  );

  // Memoize the all networks selected calculation
  const allNetworksSelected = useMemo(() => {
    return Object.keys(enabledNetworks).length === orderedNetworks.length;
  }, [enabledNetworks, orderedNetworks.length]);

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
    dispatch(setEnabledNetworks(evmChainIds));
  }, [dispatch, orderedNetworks]);

  const deselectAllDefaultNetworks = useCallback(() => {
    dispatch(setEnabledNetworks([] as CaipChainId[]));
  }, [dispatch]);

  // Memoize the network change handler to avoid recreation
  const handleNetworkChangeCallback = useCallback(
    async (chainId: CaipChainId) => {
      await handleNetworkChange(chainId);
    },
    [handleNetworkChange],
  );

  // Memoize the network list items to avoid recreation on every render
  const networkListItems = useMemo(() => {
    return orderedNetworks.map((network) => {
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
      const isEnabled = Object.keys(enabledNetworks).includes(hexChainId);

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
    isNetworkInDefaultNetworkTab,
    getItemCallbacks,
    enabledNetworks,
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
  }, [
    featuredNetworksNotYetEnabled,
    enabledNetworks,
    handleAdditionalNetworkClick,
    t,
  ]);

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
        <AdditionalNetworksInfo />
        {additionalNetworkListItems}
      </Box>
    </>
  );
});

DefaultNetworks.displayName = 'DefaultNetworks';

export { DefaultNetworks };
