import { type MultichainNetworkConfiguration } from '@metamask/multichain-network-controller';
import React, { useCallback, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { EthScope } from '@metamask/keyring-api';
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
import { getMultichainIsEvm } from '../../../../../selectors/multichain';
import {
  getEnabledNetworksByNamespace,
  getIsMultichainAccountsState2Enabled,
  getMultichainNetworkConfigurationsByChainId,
  getOrderedNetworksList,
  getShowTestNetworks,
} from '../../../../../selectors';
import { getInternalAccountBySelectedAccountGroupAndCaip } from '../../../../../selectors/multichain-accounts/account-tree';

export const CustomNetworks = React.memo(() => {
  const t = useI18nContext();
  const history = useHistory();
  const orderedNetworksList = useSelector(getOrderedNetworksList);
  const [, evmNetworks] = useSelector(
    getMultichainNetworkConfigurationsByChainId,
  );
  const isMultichainAccountsState2Enabled = useSelector(
    getIsMultichainAccountsState2Enabled,
  );

  const evmAccountGroup = useSelector((state) =>
    getInternalAccountBySelectedAccountGroupAndCaip(state, EthScope.Eoa),
  );

  const solAccountGroup = useSelector((state) =>
    getInternalAccountBySelectedAccountGroupAndCaip(
      state,
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
    ),
  );

  const showTestnets = useSelector(getShowTestNetworks);
  const enabledNetworksByNamespace = useSelector(getEnabledNetworksByNamespace);

  const { nonTestNetworks, testNetworks } = useNetworkManagerState();

  const { getItemCallbacks, hasMultiRpcOptions, isNetworkEnabled } =
    useNetworkItemCallbacks();
  const { handleNetworkChange } = useNetworkChangeHandlers();

  const isEvmNetworkSelected = useSelector(getMultichainIsEvm);

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
      const hexChainId = convertCaipToHexChainId(network.chainId);
      const isEnabled = Object.keys(enabledNetworksByNamespace).includes(
        hexChainId,
      );

      const { onDelete, onEdit, onRpcSelect } = getItemCallbacks(network);

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
          onDeleteClick={onDelete}
          onEditClick={onEdit}
          selected={isEnabled}
          onRpcEndpointClick={onRpcSelect}
          disabled={!isNetworkEnabled(network)}
        />
      );
    },
    [
      enabledNetworksByNamespace,
      getItemCallbacks,
      hasMultiRpcOptions,
      evmNetworks,
      isNetworkEnabled,
      handleNetworkClick,
    ],
  );

  // Memoize the rendered network lists with filtering
  const renderedCustomNetworks = useMemo(() => {
    // Helper function to filter networks based on account type and selection
    const getFilteredNetworks = () => {
      if (isMultichainAccountsState2Enabled) {
        return orderedNetworks.filter((network) => {
          // Show EVM networks if user has EVM accounts
          if (evmAccountGroup && network.isEvm) {
            return true;
          }
          // Show non-EVM networks if user has Solana accounts
          if (solAccountGroup && !network.isEvm) {
            return true;
          }
          return false;
        });
      }

      return orderedNetworks.filter((network) => {
        if (isEvmNetworkSelected) {
          return network.isEvm;
        }
        // If non-EVM network is selected, only show non-EVM networks
        return !network.isEvm;
      });
    };

    const filteredNetworks = getFilteredNetworks();

    // Early return if no networks to render
    if (filteredNetworks.length === 0) {
      return null;
    }

    return (
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
        {filteredNetworks.map((network) =>
          generateMultichainNetworkListItem(network),
        )}
      </>
    );
  }, [
    orderedNetworks,
    isMultichainAccountsState2Enabled,
    evmAccountGroup,
    solAccountGroup,
    isEvmNetworkSelected,
    generateMultichainNetworkListItem,
    t,
  ]);

  const renderedTestNetworks = useMemo(() => {
    const orderedTestNetworksListToRender = isMultichainAccountsState2Enabled
      ? orderedTestNetworks
      : orderedTestNetworks.filter((network) => {
          // If EVM network is selected, only show EVM networks
          if (isEvmNetworkSelected) {
            return network.isEvm;
          }
          // If non-EVM network is selected, only show non-EVM networks
          return !network.isEvm;
        });

    return orderedTestNetworksListToRender.map((network) =>
      generateMultichainNetworkListItem(network),
    );
  }, [
    orderedTestNetworks,
    isEvmNetworkSelected,
    generateMultichainNetworkListItem,
    isMultichainAccountsState2Enabled,
  ]);

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
        {(showTestnets || process.env.METAMASK_DEBUG) &&
          renderedTestNetworks.length > 0 && (
            <>
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
            </>
          )}
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
