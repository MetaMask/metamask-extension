import { BUILT_IN_NETWORKS } from '@metamask/controller-utils';
import {
  NON_EVM_TESTNET_IDS,
  type MultichainNetworkConfiguration,
} from '@metamask/multichain-network-controller';
import { type Hex } from '@metamask/utils';
import React, { useEffect, useMemo, useState } from 'react';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { MultichainNetworks } from '../../../../../../shared/constants/multichain/networks';
import {
  FEATURED_RPCS,
  TEST_CHAINS,
} from '../../../../../../shared/constants/network';
import { endTrace, TraceName } from '../../../../../../shared/lib/trace';
import {
  convertCaipToHexChainId,
  getNetworkIcon,
  getRpcDataByChainId,
  sortNetworks,
} from '../../../../../../shared/modules/network.utils';
import {
  AlignItems,
  Display,
  FlexDirection,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import {
  AvatarNetworkSize,
  Box,
  Button,
  ButtonLink,
  ButtonLinkSize,
  ButtonSize,
  ButtonVariant,
  IconName,
  IconSize,
  Text,
} from '../../../../component-library';
import { NetworkListItem } from '../../../network-list-item';
import { useNetworkChangeHandlers } from '../../hooks/useNetworkChangeHandlers';
import { useNetworkItemCallbacks } from '../../hooks/useNetworkItemCallbacks';
import { useNetworkManagerState } from '../../hooks/useNetworkManagerState';

export const CustomNetworks = () => {
  const t = useI18nContext();
  // Use the shared state hook
  const {
    history,
    orderedNetworksList,
    multichainNetworks,
    evmNetworks,
    currentChainId,
    canSelectNetwork,
  } = useNetworkManagerState();

  const { getItemCallbacks, hasMultiRpcOptions, isNetworkEnabled } =
    useNetworkItemCallbacks();
  const { handleNetworkChange } = useNetworkChangeHandlers();

  useEffect(() => {
    endTrace({ name: TraceName.NetworkList });
  }, []);

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

          // Pre-filter to only include networks that are NOT in built-in networks or featured RPCs
          const hexChainId = network.isEvm
            ? convertCaipToHexChainId(network.chainId)
            : network.chainId;

          // Check if the network is NOT a built-in network or featured RPC
          const isBuiltInNetwork = Object.values(BUILT_IN_NETWORKS).some(
            (builtInNetwork) => builtInNetwork.chainId === hexChainId,
          );
          const isFeaturedRpc = FEATURED_RPCS.some(
            (featuredRpc) => featuredRpc.chainId === hexChainId,
          );

          const isMultichainProviderConfig = Object.values(
            MultichainNetworks,
          ).some(
            (multichainNetwork) =>
              multichainNetwork === network.chainId ||
              (network.isEvm
                ? convertCaipToHexChainId(network.chainId)
                : network.chainId) === multichainNetwork,
          );

          const shouldInclude =
            !isBuiltInNetwork && !isFeaturedRpc && !isMultichainProviderConfig;

          if (shouldInclude || isTest) {
            (isTest ? testnetsList : nonTestnetsList)[chainId] = network;
          }

          return [nonTestnetsList, testnetsList];
        },
        [
          {} as Record<string, MultichainNetworkConfiguration>,
          {} as Record<string, MultichainNetworkConfiguration>,
        ],
      ),
    [multichainNetworks],
  );

  const [orderedNetworks, setOrderedNetworks] = useState(
    sortNetworks(nonTestNetworks, orderedNetworksList),
  );

  const [orderedTestNetworks, setOrderedTestNetworks] = useState(
    sortNetworks(testNetworks, orderedNetworksList),
  );

  useEffect(
    () =>
      setOrderedNetworks(sortNetworks(nonTestNetworks, orderedNetworksList)),
    [nonTestNetworks, orderedNetworksList],
  );

  // Renders a network in the network list
  const generateMultichainNetworkListItem = (
    network: MultichainNetworkConfiguration,
  ) => {
    const isCurrentNetwork = network.chainId === currentChainId;
    const isTestNetwork = TEST_CHAINS.includes(
      network.isEvm
        ? convertCaipToHexChainId(network.chainId)
        : (network.chainId as Hex),
    );
    const { onDelete, onEdit, onRpcConfigEdit } = getItemCallbacks(network);

    return (
      <NetworkListItem
        key={network.chainId}
        chainId={network.chainId}
        name={network.name}
        iconSrc={getNetworkIcon(network)}
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
        onDeleteClick={isTestNetwork ? undefined : onDelete}
        onEditClick={isTestNetwork ? undefined : onEdit}
        selected={isCurrentNetwork}
        onRpcEndpointClick={onRpcConfigEdit}
        disabled={!isNetworkEnabled(network)}
      />
    );
  };

  return (
    <>
      <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
        <Text
          variant={TextVariant.bodyMdMedium}
          color={TextColor.textAlternative}
          padding={4}
        >
          {t('customNetworks')}
        </Text>
        {orderedNetworks.length > 0 ? (
          orderedNetworks.map((network) =>
            generateMultichainNetworkListItem(network),
          )
        ) : (
          <Text
            variant={TextVariant.bodyMdMedium}
            color={TextColor.textAlternative}
            padding={10}
            textAlign={TextAlign.Center}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
          >
            {t('noCustomNetworks')}
          </Text>
        )}
        <Text
          variant={TextVariant.bodyMdMedium}
          color={TextColor.textAlternative}
          padding={4}
          marginTop={4}
        >
          {t('testNetworks')}
        </Text>
        {orderedTestNetworks.map((network) =>
          generateMultichainNetworkListItem(network),
        )}
      </Box>
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        marginTop={10}
      >
        <Button
          variant={ButtonVariant.Secondary}
          size={ButtonSize.Lg}
          startIconProps={{
            size: IconSize.Lg,
          }}
          startIconName={IconName.Add}
          onClick={() => {
            history.push('/add');
          }}
        >
          {t('addCustomNetwork')}
        </Button>
      </Box>
    </>
  );
};
