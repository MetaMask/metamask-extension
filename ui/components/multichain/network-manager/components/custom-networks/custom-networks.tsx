import {
  type MultichainNetworkConfiguration
} from '@metamask/multichain-network-controller';
import { type Hex } from '@metamask/utils';
import React, { useEffect, useState } from 'react';
import {
  TEST_CHAINS
} from '../../../../../../shared/constants/network';
import { endTrace, TraceName } from '../../../../../../shared/lib/trace';
import {
  convertCaipToHexChainId,
  getNetworkIcon,
  getRpcDataByChainId,
  sortNetworks,
} from '../../../../../../shared/modules/network.utils';
import {
  Display,
  FlexDirection,
  TextColor,
  TextVariant
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  AvatarNetworkSize,
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  IconName,
  IconSize,
  Text
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
    evmNetworks,
    currentChainId,
    nonTestNetworks,
    testNetworks,
  } = useNetworkManagerState();

  const { getItemCallbacks, hasMultiRpcOptions, isNetworkEnabled } =
    useNetworkItemCallbacks();
  const { handleNetworkChange } = useNetworkChangeHandlers();

  useEffect(() => {
    endTrace({ name: TraceName.NetworkList });
  }, []);

  const [orderedNetworks, setOrderedNetworks] = useState(
    sortNetworks(nonTestNetworks, orderedNetworksList),
  );

  const [orderedTestNetworks, ] = useState(
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
          await handleNetworkChange(network.chainId, {
            overrideEnabledNetworks: true,
          });
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
        {orderedNetworks?.length > 0 && (
          <>
            <Text
              variant={TextVariant.bodyMdMedium}
              color={TextColor.textAlternative}
              padding={4}
            >
              {t('customNetworks')}
            </Text>
            {orderedNetworks.map((network) =>
              generateMultichainNetworkListItem(network),
            )}
          </>
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
