import { ApprovalType } from '@metamask/controller-utils';
import {
  type MultichainNetworkConfiguration
} from '@metamask/multichain-network-controller';
import { CaipChainId } from '@metamask/utils';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ORIGIN_METAMASK } from '../../../../../../shared/constants/app';
import { MetaMetricsNetworkEventSource } from '../../../../../../shared/constants/metametrics';
import {
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  FEATURED_RPCS
} from '../../../../../../shared/constants/network';
import {
  convertCaipToHexChainId,
  getNetworkIcon,
  getRpcDataByChainId,
  sortNetworks,
} from '../../../../../../shared/modules/network.utils';
import {
  AlignItems,
  BorderRadius,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import {
  hideModal,
  requestUserApproval,
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
import { useNetworkChangeHandlers } from '../../hooks/useNetworkChangeHandlers';
import { useNetworkItemCallbacks } from '../../hooks/useNetworkItemCallbacks';
import { useNetworkManagerState } from '../../hooks/useNetworkManagerState';
import { AdditionalNetworksInfo } from '../additional-networks-info';

export const DefaultNetworks = () => {
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

  const [orderedNetworks, setOrderedNetworks] = useState(
    sortNetworks(nonTestNetworks, orderedNetworksList),
  );

  const allNetworksSelected = useMemo(() => {
    return Object.keys(enabledNetworks).length === orderedNetworks.length;
  }, [enabledNetworks, orderedNetworks]);

  const selectAllDefaultNetworks = useCallback(() => {
    const shouldSelect = orderedNetworks.map((network) =>
      network.isEvm
        ? convertCaipToHexChainId(network.chainId)
        : network.chainId,
    );
    dispatch(setEnabledNetworks(shouldSelect as CaipChainId[]));
  }, [dispatch, orderedNetworks]);

  const deselectAllDefaultNetworks = useCallback(() => {
    dispatch(setEnabledNetworks([] as CaipChainId[]));
  }, [dispatch]);

  useEffect(
    () =>
      setOrderedNetworks(sortNetworks(nonTestNetworks, orderedNetworksList)),
    [nonTestNetworks, orderedNetworksList],
  );

  const featuredNetworksNotYetEnabled = useMemo(
    () =>
      FEATURED_RPCS.filter(({ chainId }) => !evmNetworks[chainId]).sort(
        (a, b) => a.name.localeCompare(b.name),
      ),
    [evmNetworks],
  );

  // Renders a network in the network list
  const generateMultichainNetworkListItem = (
    network: MultichainNetworkConfiguration,
  ) => {
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
        startAccessory={
          <Checkbox label="" onChange={() => {}} isChecked={isEnabled} />
        }
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
          await handleNetworkChange(network.chainId);
        }}
        onDeleteClick={onDelete}
        onEditClick={onEdit}
        onDiscoverClick={onDiscoverClick}
        onRpcEndpointClick={onRpcConfigEdit}
      />
    );
  };

  const handleAdditionalNetworkClick = async (network: any) => {
    dispatch(hideModal());
    await dispatch(
      requestUserApproval({
        origin: ORIGIN_METAMASK,
        type: ApprovalType.AddEthereumChain,
        requestData: {
          chainId: network.chainId,
          rpcUrl: network.rpcEndpoints[network.defaultRpcEndpointIndex].url,
          failoverRpcUrls:
            network.rpcEndpoints[network.defaultRpcEndpointIndex].failoverUrls,
          ticker: network.nativeCurrency,
          rpcPrefs: {
            blockExplorerUrl:
              network.defaultBlockExplorerUrlIndex === undefined
                ? undefined
                : network.blockExplorerUrls[
                    network.defaultBlockExplorerUrlIndex
                  ],
          },
          imageUrl:
            CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
              network.chainId as keyof typeof CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP
            ],
          chainName: network.name,
          referrer: ORIGIN_METAMASK,
          source: MetaMetricsNetworkEventSource.NewAddNetworkFlow,
        },
      }),
    );
  };

  const generateAdditionalNetworkListItem = (network: any) => {
    const networkImageUrl =
      CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
        network.chainId as keyof typeof CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP
      ];

    return (
      <Box
        display={Display.Flex}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.spaceBetween}
        onClick={() => {
          handleAdditionalNetworkClick(network);
        }}
        paddingTop={4}
        paddingBottom={4}
        data-testid="additional-network-item"
      >
        <Box display={Display.Flex} alignItems={AlignItems.center} gap={3}>
          <Box className="additional-network-item__button-icon">
            <ButtonIcon
              size={ButtonIconSize.Lg}
              color={IconColor.iconAlternative}
              iconName={IconName.Add}
              padding={0}
              margin={0}
              ariaLabel={t('addNetwork')}
            />
          </Box>
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
      </Box>
    );
  };

  return (
    <>
      <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.flexStart}
          padding={4}
          paddingBottom={2}
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
        {orderedNetworks.map((network) =>
          generateMultichainNetworkListItem(network),
        )}
        <AdditionalNetworksInfo />
        {featuredNetworksNotYetEnabled.map((network) =>
          generateAdditionalNetworkListItem(network),
        )}
      </Box>
    </>
  );
};
