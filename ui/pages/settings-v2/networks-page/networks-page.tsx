import {
  type NetworkConfiguration,
  type AddNetworkFields,
  RpcEndpointType,
  UpdateNetworkFields,
} from '@metamask/network-controller';
import {
  toEvmCaipChainId,
  type MultichainNetworkConfiguration,
} from '@metamask/multichain-network-controller';
import { ChainId } from '@metamask/controller-utils';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as URI from 'uri-js';
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
  FontWeight,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { AvatarNetworkSize as LegacyAvatarNetworkSize } from '../../../components/component-library/avatar-network';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useNetworkFormState } from '../../settings/networks-tab/networks-form/networks-form-state';
import {
  setEditedNetwork,
  setShowTestNetworks,
  addNetwork,
} from '../../../store/actions';
import { ModalHeader } from '../../../components/component-library/modal-header';
import { ModalBody } from '../../../components/component-library/modal-body';
import { SuccessPill } from '../../../components/component-library/success-pill';
import AddBlockExplorerModal from '../../../components/multichain/network-list-menu/add-block-explorer-modal/add-block-explorer-modal';
import AddRpcUrlModal from '../../../components/multichain/network-list-menu/add-rpc-url-modal/add-rpc-url-modal';
import { SelectRpcUrlModal } from '../../../components/multichain/network-list-menu/select-rpc-url-modal/select-rpc-url-modal';
import { AddNetwork } from '../../../components/multichain/network-manager/components/add-network';
import {
  DEFAULT_ROUTE,
  SETTINGS_V2_ROUTE,
} from '../../../helpers/constants/routes';
import { useNetworkManagerState } from '../../../components/multichain/network-manager/hooks/useNetworkManagerState';
import {
  getFilteredFeaturedNetworks,
  getNetworkIcon,
  getRpcDataByChainId,
  sortNetworks,
  sortNetworksByPrioity,
} from '../../../../shared/lib/network.utils';
import {
  FEATURED_RPCS,
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
} from '../../../../shared/constants/network';
import { selectAdditionalNetworksBlacklistFeatureFlag } from '../../../selectors/network-blacklist/network-blacklist';
import { getMultichainNetworkConfigurationsByChainId } from '../../../selectors/multichain/networks';
import { NetworkListItem } from '../../../components/multichain/network-list-item';
import { useNetworkItemCallbacks } from '../../../components/multichain/network-manager/hooks/useNetworkItemCallbacks';
import { useNetworkChangeHandlers } from '../../../components/multichain/network-manager/hooks/useNetworkChangeHandlers';
import ToggleButton from '../../../components/ui/toggle-button';
import { AdditionalNetworksInfo } from '../../../components/multichain/network-manager/components/additional-networks-info';
import {
  getEditedNetwork,
  getOrderedNetworksList,
  getShowTestNetworks,
} from '../../../selectors/selectors';
import { useIsNetworkGasSponsored } from '../../../hooks/useIsNetworkGasSponsored';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { SettingsV2Header } from '../shared/settings-v2-header';

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
      onClick={() => dispatch(addNetwork(network))}
      paddingTop={4}
      paddingBottom={4}
      gap={4}
      className="network-manager__additional-network-item w-full px-4"
      key={network.chainId}
      data-testid={`networks-page-additional-network-${network.chainId}`}
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
          <SuccessPill label={t('noNetworkFee')} />
        ) : null}
      </Box>
      <ButtonIcon
        size={ButtonIconSize.Md}
        color={IconColor.IconDefault}
        iconName={IconName.Add}
        className="ml-auto"
        ariaLabel={t('addNetwork')}
      />
    </Box>
  );
};

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

const NetworksPageList = ({ searchQuery }: { searchQuery: string }) => {
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
          iconSize={LegacyAvatarNetworkSize.Md}
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

      <Box padding={4}>
        <Button
          className="w-full"
          variant={ButtonVariant.Secondary}
          onClick={() => setSearchParams({ view: 'add' })}
        >
          {t('addACustomNetwork')}
        </Button>
      </Box>
    </Box>
  );
};

export const NetworksPage = () => {
  const dispatch = useDispatch();
  const t = useI18nContext();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get('view') ?? '';
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const handleNewNetwork = useCallback(() => {
    setSearchParams({ view: 'add' });
  }, [setSearchParams]);

  const [, evmNetworks] = useSelector(
    getMultichainNetworkConfigurationsByChainId,
  );
  const { chainId: editingChainId, editCompleted } =
    useSelector(getEditedNetwork) ?? {};

  const editedNetwork = useMemo((): UpdateNetworkFields | undefined => {
    if (view === 'add') {
      return undefined;
    }
    if (view === 'select-rpc') {
      return editingChainId
        ? evmNetworks[editingChainId as keyof typeof evmNetworks]
        : undefined;
    }
    return !editingChainId || editCompleted
      ? undefined
      : Object.entries(evmNetworks).find(
          ([chainId]) => chainId === editingChainId,
        )?.[1];
  }, [editingChainId, editCompleted, evmNetworks, view]);

  const networkFormState = useNetworkFormState(editedNetwork);

  const handleAddRPC = useCallback(
    (url: string, name?: string) => {
      if (
        networkFormState.rpcUrls.rpcEndpoints?.every(
          (endpoint) => !URI.equal(endpoint.url, url),
        )
      ) {
        networkFormState.setRpcUrls({
          rpcEndpoints: [
            ...networkFormState.rpcUrls.rpcEndpoints,
            { url, name, type: RpcEndpointType.Custom },
          ],
          defaultRpcEndpointIndex: networkFormState.rpcUrls.rpcEndpoints.length,
        });

        setSearchParams({ view: view === 'edit-rpc' ? 'edit' : 'add' });
      }
    },
    [networkFormState, setSearchParams, view],
  );

  const handleAddExplorerUrl = useCallback(
    (onComplete?: () => void) => {
      return (url: string) => {
        if (
          networkFormState.blockExplorers.blockExplorerUrls?.every(
            (existingUrl) => existingUrl !== url,
          )
        ) {
          networkFormState.setBlockExplorers({
            blockExplorerUrls: [
              ...networkFormState.blockExplorers.blockExplorerUrls,
              url,
            ],
            defaultBlockExplorerUrlIndex:
              networkFormState.blockExplorers.blockExplorerUrls.length,
          });
          setSearchParams({
            view: view === 'edit-explorer-url' ? 'edit' : 'add',
          });
          onComplete?.();
        }
      };
    },
    [networkFormState, setSearchParams, view],
  );

  const handleClose = useCallback(() => {
    dispatch(setEditedNetwork());
    navigate(SETTINGS_V2_ROUTE);
  }, [dispatch, navigate]);

  const handleGoHome = useCallback(() => {
    setSearchParams({});
  }, [setSearchParams]);

  const handleEditOnComplete = useCallback(() => {
    setSearchParams({ view: 'edit' });
  }, [setSearchParams]);

  const handleAddOnComplete = useCallback(() => {
    setSearchParams({ view: 'add' });
  }, [setSearchParams]);

  const handleRootBack = useCallback(() => {
    navigate(
      searchParams.get('drawerOpen') === 'true'
        ? `${DEFAULT_ROUTE}?drawerOpen=true`
        : DEFAULT_ROUTE,
    );
  }, [navigate, searchParams]);

  return (
    <Box className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      {view === '' ? (
        <>
          <SettingsV2Header
            title={t('networks')}
            onClose={handleRootBack}
            isSearchOpen={isSearchOpen}
            onOpenSearch={() => setIsSearchOpen(true)}
            onCloseSearch={() => setIsSearchOpen(false)}
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            onSearchClear={() => setSearchValue('')}
            showSearchBorder={false}
          />
          <NetworksPageList searchQuery={searchValue} />
        </>
      ) : null}
      {view === 'add' && (
        <>
          <ModalHeader onClose={handleClose} onBack={handleGoHome}>
            {t('addNetwork')}
          </ModalHeader>
          <ModalBody style={{ paddingTop: 0 }}>
            <AddNetwork
              networkFormState={networkFormState}
              network={editedNetwork as UpdateNetworkFields}
            />
          </ModalBody>
        </>
      )}
      {view === 'add-rpc' && (
        <>
          <ModalHeader onClose={handleClose} onBack={handleNewNetwork}>
            {t('addRpcUrl')}
          </ModalHeader>
          <ModalBody style={{ paddingTop: 0 }}>
            <AddRpcUrlModal onAdded={handleAddRPC} />
          </ModalBody>
        </>
      )}
      {view === 'edit-rpc' && (
        <>
          <ModalHeader onClose={handleClose} onBack={handleEditOnComplete}>
            {t('addRpcUrl')}
          </ModalHeader>
          <ModalBody style={{ paddingTop: 0 }}>
            <AddRpcUrlModal onAdded={handleAddRPC} />
          </ModalBody>
        </>
      )}
      {view === 'add-explorer-url' && (
        <>
          <ModalHeader onClose={handleClose} onBack={handleNewNetwork}>
            {t('addBlockExplorerUrl')}
          </ModalHeader>
          <ModalBody style={{ paddingTop: 0 }}>
            <AddBlockExplorerModal
              onAdded={handleAddExplorerUrl(handleAddOnComplete)}
            />
          </ModalBody>
        </>
      )}
      {view === 'edit-explorer-url' && (
        <>
          <ModalHeader onClose={handleClose} onBack={handleNewNetwork}>
            {t('addBlockExplorerUrl')}
          </ModalHeader>
          <ModalBody style={{ paddingTop: 0 }}>
            <AddBlockExplorerModal
              onAdded={handleAddExplorerUrl(handleEditOnComplete)}
            />
          </ModalBody>
        </>
      )}
      {view === 'edit' && (
        <>
          <ModalHeader onClose={handleClose} onBack={handleGoHome}>
            {t('editNetwork')}
          </ModalHeader>
          <ModalBody style={{ paddingTop: 0 }}>
            <AddNetwork
              networkFormState={networkFormState}
              network={editedNetwork as UpdateNetworkFields}
              isEdit={true}
            />
          </ModalBody>
        </>
      )}
      {view === 'select-rpc' && (
        <>
          <ModalHeader onClose={handleClose} onBack={handleGoHome}>
            {t('selectRpcUrl')}
          </ModalHeader>
          <ModalBody style={{ paddingTop: 0 }}>
            <SelectRpcUrlModal
              networkConfiguration={editedNetwork as NetworkConfiguration}
              onNetworkChange={handleClose}
            />
          </ModalBody>
        </>
      )}
    </Box>
  );
};

export default NetworksPage;
