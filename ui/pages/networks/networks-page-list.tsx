import {
  type AddNetworkFields,
  type NetworkConfiguration,
} from '@metamask/network-controller';
import {
  toEvmCaipChainId,
  type MultichainNetworkConfiguration,
} from '@metamask/multichain-network-controller';
import { ChainId } from '@metamask/controller-utils';
import React, { useCallback, useContext, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import {
  AvatarNetwork,
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  Button,
  ButtonIcon,
  ButtonIconSize,
  ButtonVariant,
  BoxBackgroundColor,
  FontWeight,
  IconColor,
  IconName,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { AdditionalNetworksInfo } from '../../components/multichain/network-manager/components/additional-networks-info';
import { useNetworkChangeHandlers } from '../../components/multichain/network-manager/hooks/useNetworkChangeHandlers';
import { useNetworkItemCallbacks } from '../../components/multichain/network-manager/hooks/useNetworkItemCallbacks';
import { NetworkListItem } from '../../components/multichain/network-list-item';
import ToggleButton from '../../components/ui/toggle-button';
import { MetaMetricsContext } from '../../contexts/metametrics';
import { useI18nContext } from '../../hooks/useI18nContext';
import { useIsNetworkGasSponsored } from '../../hooks/useIsNetworkGasSponsored';
import { selectAdditionalNetworksBlacklistFeatureFlag } from '../../selectors/network-blacklist/network-blacklist';
import { getMultichainNetworkConfigurationsByChainId } from '../../selectors/multichain/networks';
import {
  getOrderedNetworksList,
  getShowTestNetworks,
} from '../../selectors/selectors';
import {
  addNetwork,
  setEditedNetwork,
  setShowTestNetworks,
} from '../../store/actions';
import {
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  FEATURED_RPCS,
} from '../../../shared/constants/network';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import {
  getFilteredFeaturedNetworks,
  getNetworkIcon,
  getRpcDataByChainId,
  sortNetworks,
  sortNetworksByPrioity,
} from '../../../shared/lib/network.utils';
import { useNetworkManagerState } from '../../components/multichain/network-manager/hooks/useNetworkManagerState';

const filterNetworks = <
  NetworkRecord extends {
    name?: string;
    chainId?: string;
    nativeCurrency?: string;
  },
>(
  networks: NetworkRecord[],
  query: string,
) => {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return networks;
  }

  return networks.filter((network) =>
    [network.name, network.chainId, network.nativeCurrency]
      .filter(Boolean)
      .some((value) => value?.toLowerCase().includes(normalizedQuery)),
  );
};

const AdditionalNetworkRow = ({ network }: { network: AddNetworkFields }) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { isNetworkGasSponsored } = useIsNetworkGasSponsored(network.chainId);
  const networkImageUrl =
    CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
      network.chainId as keyof typeof CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP
    ];

  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      justifyContent={BoxJustifyContent.Start}
      onClick={async () => {
        await dispatch(addNetwork(network, { setActive: false }));
        dispatch(
          setEditedNetwork({
            chainId: network.chainId,
            nickname: network.name,
            editCompleted: true,
            newNetwork: true,
          }),
        );
      }}
      paddingTop={4}
      paddingBottom={4}
      gap={4}
      className="network-manager__additional-network-item w-full px-4"
      key={network.chainId}
      data-testid={`popular-network-${network.chainId}`}
    >
      <AvatarNetwork name={network.name} size="md" src={networkImageUrl} />
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        gap={2}
      >
        <Text
          variant={TextVariant.BodyMd}
          fontWeight={FontWeight.Medium}
          color={TextColor.TextDefault}
        >
          {network.name}
        </Text>
        {isNetworkGasSponsored ? (
          <Box
            backgroundColor={BoxBackgroundColor.SuccessMuted}
            className="rounded-md px-2 py-1"
          >
            <Text variant={TextVariant.BodySm} color={TextColor.SuccessDefault}>
              {t('noNetworkFee')}
            </Text>
          </Box>
        ) : null}
      </Box>
      <ButtonIcon
        size={ButtonIconSize.Md}
        color={IconColor.IconDefault}
        iconName={IconName.Add}
        data-testid="test-add-button"
        className="ml-auto"
        ariaLabel={t('addNetwork')}
      />
    </Box>
  );
};

type NetworksPageListProps = {
  searchQuery: string;
  footerContent?: React.ReactNode;
};

export const NetworksPageList = ({
  searchQuery,
  footerContent,
}: NetworksPageListProps) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { trackEvent } = useContext(MetaMetricsContext);
  const [, setSearchParams] = useSearchParams();

  const orderedNetworksList = useSelector(getOrderedNetworksList);
  const showTestnets = useSelector(getShowTestNetworks);
  const [, evmNetworks] = useSelector(
    getMultichainNetworkConfigurationsByChainId,
  );
  const blacklistedChainIds = useSelector(
    selectAdditionalNetworksBlacklistFeatureFlag,
  );

  const { nonTestNetworks, testNetworks } = useNetworkManagerState({
    showDefaultNetworks: true,
  });
  const { getItemCallbacks, hasMultiRpcOptions, isNetworkEnabled } =
    useNetworkItemCallbacks();
  const { handleNetworkChange } = useNetworkChangeHandlers();

  const orderedNetworks = useMemo(
    () =>
      filterNetworks(
        sortNetworks(nonTestNetworks, orderedNetworksList),
        searchQuery,
      ),
    [nonTestNetworks, orderedNetworksList, searchQuery],
  );

  const featuredNetworksNotYetEnabled = useMemo(() => {
    const availableNetworks = FEATURED_RPCS.filter(
      ({ chainId }) => !evmNetworks[chainId],
    );

    return getFilteredFeaturedNetworks(blacklistedChainIds, availableNetworks)
      .sort((networkA, networkB) => networkA.name.localeCompare(networkB.name))
      .filter((network) => filterNetworks([network], searchQuery).length > 0);
  }, [evmNetworks, blacklistedChainIds, searchQuery]);

  const sortedTestNetworks = useMemo(
    () =>
      filterNetworks(
        sortNetworksByPrioity(Object.values(testNetworks), [
          toEvmCaipChainId(ChainId.sepolia),
          toEvmCaipChainId(ChainId['linea-sepolia']),
        ]),
        searchQuery,
      ),
    [testNetworks, searchQuery],
  );

  const renderNetworkListItem = useCallback(
    (network: MultichainNetworkConfiguration) => {
      const { onDelete, onEdit, onDiscoverClick, onRpcSelect } =
        getItemCallbacks(network);

      return (
        <NetworkListItem
          key={network.chainId}
          chainId={network.chainId}
          name={network.name}
          iconSrc={getNetworkIcon(network)}
          focus={false}
          selected={false}
          rpcEndpoint={
            network.isEvm && hasMultiRpcOptions(network)
              ? getRpcDataByChainId(network.chainId, evmNetworks)
                  .defaultRpcEndpoint
              : undefined
          }
          onClick={() => handleNetworkChange(network.chainId)}
          onDeleteClick={onDelete}
          onEditClick={onEdit}
          onDiscoverClick={onDiscoverClick}
          onRpcEndpointClick={onRpcSelect}
          disabled={!isNetworkEnabled(network)}
          notSelectable={false}
        />
      );
    },
    [
      evmNetworks,
      getItemCallbacks,
      handleNetworkChange,
      hasMultiRpcOptions,
      isNetworkEnabled,
    ],
  );

  const handleToggleTestNetworks = useCallback(
    (value: boolean) => {
      const newValue = !value;
      dispatch(setShowTestNetworks(newValue));
      trackEvent({
        event: MetaMetricsEventName.TestNetworksDisplayed,
        category: MetaMetricsEventCategory.Network,
        properties: {
          value: newValue,
        },
      });
    },
    [dispatch, trackEvent],
  );

  return (
    <Box
      className="flex h-full min-h-0 w-full flex-col"
      data-testid="networks-page-list"
    >
      <Box className="flex-1 overflow-y-auto pt-2">
        {orderedNetworks.length > 0 ? (
          <Box
            padding={4}
            paddingBottom={2}
            flexDirection={BoxFlexDirection.Row}
            justifyContent={BoxJustifyContent.Between}
          >
            <Text color={TextColor.TextAlternative}>
              {t('enabledNetworks')}
            </Text>
          </Box>
        ) : null}

        <Box>{orderedNetworks.map(renderNetworkListItem)}</Box>

        {featuredNetworksNotYetEnabled.length > 0 ? (
          <>
            <AdditionalNetworksInfo />
            <Box>
              {featuredNetworksNotYetEnabled.map((network) => (
                <AdditionalNetworkRow key={network.chainId} network={network} />
              ))}
            </Box>
          </>
        ) : null}

        {sortedTestNetworks.length > 0 ? (
          <Box
            paddingBottom={4}
            paddingTop={4}
            flexDirection={BoxFlexDirection.Row}
            justifyContent={BoxJustifyContent.Between}
            alignItems={BoxAlignItems.Center}
            className="px-4"
          >
            <Text color={TextColor.TextAlternative}>
              {t('showTestnetNetworks')}
            </Text>
            <ToggleButton
              dataTestId="networks-page-show-test-networks"
              value={showTestnets}
              onToggle={handleToggleTestNetworks}
            />
          </Box>
        ) : null}

        {showTestnets ? (
          <Box>{sortedTestNetworks.map(renderNetworkListItem)}</Box>
        ) : null}
      </Box>

      <Box padding={4} gap={4} flexDirection={BoxFlexDirection.Column}>
        {footerContent}
        <Button
          className="w-full"
          variant={ButtonVariant.Secondary}
          onClick={() => setSearchParams({ view: 'add' })}
          data-testid="networks-page-add-custom-network-button"
        >
          {t('addACustomNetwork')}
        </Button>
      </Box>
    </Box>
  );
};
