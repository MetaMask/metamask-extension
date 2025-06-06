import { ApprovalType, BUILT_IN_NETWORKS } from '@metamask/controller-utils';
import {
  NON_EVM_TESTNET_IDS,
  type MultichainNetworkConfiguration,
} from '@metamask/multichain-network-controller';
import { type Hex } from '@metamask/utils';
import React, { useEffect, useMemo, useState } from 'react';
import { ORIGIN_METAMASK } from '../../../../../../shared/constants/app';
import { MetaMetricsNetworkEventSource } from '../../../../../../shared/constants/metametrics';
import { MultichainNetworks } from '../../../../../../shared/constants/multichain/networks';
import {
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  FEATURED_RPCS,
  TEST_CHAINS,
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
import { hideModal, requestUserApproval } from '../../../../../store/actions';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  ButtonIcon,
  ButtonIconSize,
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
    multichainNetworks,
    evmNetworks,
    editingChainId,
    editCompleted,
    canSelectNetwork,
  } = useNetworkManagerState();

  // Use the shared callbacks hook
  const { getItemCallbacks, hasMultiRpcOptions, isNetworkEnabled } =
    useNetworkItemCallbacks();

  // Use the shared network change handlers hook
  const { handleNetworkChange } = useNetworkChangeHandlers();

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
          (isTest ? testnetsList : nonTestnetsList)[chainId] = network;
          return [nonTestnetsList, testnetsList];
        },
        [
          {} as Record<string, MultichainNetworkConfiguration>,
          {} as Record<string, MultichainNetworkConfiguration>,
        ],
      ),
    [multichainNetworks],
  );

  // The network currently being edited, or undefined
  // if the user is not currently editing a network.
  //
  // The memoized value is EVM specific, therefore we
  // provide the evmNetworks object as a dependency.

  const [orderedNetworks, setOrderedNetworks] = useState(
    sortNetworks(nonTestNetworks, orderedNetworksList),
  );

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

    if (!isBuiltInNetwork && !isFeaturedRpc && !isMultichainProviderConfig) {
      return null;
    }

    const { onDelete, onEdit, onDiscoverClick, onRpcConfigEdit } =
      getItemCallbacks(network); // Pass true for includeModalCallbacks
    const iconSrc = getNetworkIcon(network);

    return (
      <NetworkListItem
        startAccessory={
          <Checkbox label="" onChange={() => {}} isChecked={true} />
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
          if (canSelectNetwork) {
            await handleNetworkChange(network.chainId);
          }
        }}
        onDeleteClick={onDelete}
        onEditClick={onEdit}
        onDiscoverClick={onDiscoverClick}
        // selected={isCurrentNetwork}
        onRpcEndpointClick={onRpcConfigEdit}
        disabled={!isNetworkEnabled(network)}
        notSelectable={!canSelectNetwork}
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
        {orderedNetworks.map((network) =>
          generateMultichainNetworkListItem(network),
        )}
        <AdditionalNetworksInfo />
        {featuredNetworksNotYetEnabled.map((network) =>
          generateAdditionalNetworkListItem(network),
        ) || null}
      </Box>
      <Box display={Display.Flex} flexDirection={FlexDirection.Column}></Box>
    </>
  );
};
