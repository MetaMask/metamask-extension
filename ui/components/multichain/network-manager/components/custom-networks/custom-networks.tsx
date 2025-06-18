import { type MultichainNetworkConfiguration } from '@metamask/multichain-network-controller';
import { type Hex } from '@metamask/utils';
import React, { useCallback, useEffect, useMemo } from 'react';
import { TEST_CHAINS } from '../../../../../../shared/constants/network';
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
  TextVariant,
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
  Text,
} from '../../../../component-library';
import { NetworkListItem } from '../../../network-list-item';
import { useNetworkChangeHandlers } from '../../hooks/useNetworkChangeHandlers';
import { useNetworkItemCallbacks } from '../../hooks/useNetworkItemCallbacks';
import { useNetworkManagerState } from '../../hooks/useNetworkManagerState';

export const CustomNetworks = React.memo(() => {
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

  const { orderedNetworks, orderedTestNetworks } = useMemo(
    () => ({
      orderedNetworks: sortNetworks(nonTestNetworks, orderedNetworksList),
      orderedTestNetworks: sortNetworks(testNetworks, orderedNetworksList),
    }),
    [nonTestNetworks, testNetworks, orderedNetworksList],
  );

  // Memoize the network click handler
  const handleNetworkClick = useCallback(
    async (chainId: MultichainNetworkConfiguration['chainId']) => {
      await handleNetworkChange(chainId);
    },
    [handleNetworkChange],
  );

  // Renders a network in the network list
  const generateMultichainNetworkListItem = useCallback(
    (network: MultichainNetworkConfiguration) => {
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
          onClick={() => handleNetworkClick(network.chainId)}
          onDeleteClick={isTestNetwork ? undefined : onDelete}
          onEditClick={isTestNetwork ? undefined : onEdit}
          selected={isCurrentNetwork}
          onRpcEndpointClick={onRpcConfigEdit}
          disabled={!isNetworkEnabled(network)}
        />
      );
    },
    [
      currentChainId,
      getItemCallbacks,
      hasMultiRpcOptions,
      isNetworkEnabled,
      evmNetworks,
      handleNetworkClick,
    ],
  );

  // Memoize the rendered network lists
  const renderedCustomNetworks = useMemo(
    () =>
      orderedNetworks?.length > 0 ? (
        <>
          <Text
            variant={TextVariant.bodyMdMedium}
            color={TextColor.textAlternative}
            paddingLeft={4}
            paddingRight={4}
            paddingTop={4}
          >
            {t('customNetworks')}
          </Text>
          {orderedNetworks.map((network) =>
            generateMultichainNetworkListItem(network),
          )}
        </>
      ) : null,
    [orderedNetworks, generateMultichainNetworkListItem, t],
  );

  const renderedTestNetworks = useMemo(
    () =>
      orderedTestNetworks.map((network) =>
        generateMultichainNetworkListItem(network),
      ),
    [orderedTestNetworks, generateMultichainNetworkListItem],
  );

  // Memoize the padding value to prevent unnecessary re-renders
  const buttonContainerPaddingTop = useMemo(
    () => (renderedTestNetworks.length > 0 ? 4 : 0),
    [renderedTestNetworks.length],
  );

  // Memoize the add button click handler
  const handleAddNetworkClick = useCallback(() => {
    history.push('/add');
  }, [history]);

  return (
    <>
      <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
        {renderedCustomNetworks}
        <Text
          variant={TextVariant.bodyMdMedium}
          color={TextColor.textAlternative}
          paddingLeft={4}
          paddingRight={4}
          paddingTop={4}
        >
          {t('testnets')}
        </Text>
        {renderedTestNetworks}
      </Box>
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        paddingLeft={4}
        paddingRight={4}
        paddingTop={buttonContainerPaddingTop}
      >
        <Button
          variant={ButtonVariant.Secondary}
          size={ButtonSize.Lg}
          startIconProps={{
            size: IconSize.Lg,
          }}
          startIconName={IconName.Add}
          onClick={handleAddNetworkClick}
        >
          {t('addCustomNetwork')}
        </Button>
      </Box>
    </>
  );
});
