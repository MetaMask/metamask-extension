import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  ButtonIcon as DsButtonIcon,
  ButtonIconSize as DsButtonIconSize,
  IconName as DsIconName,
} from '@metamask/design-system-react';
import {
  getAllChainsToPoll,
  getIsLineaMainnet,
  getIsMainnet,
  getTokenNetworkFilter,
  getUseNftDetection,
} from '../../../../../selectors';
import { getSelectedInternalAccount } from '../../../../../../shared/lib/selectors/accounts';
import { selectAccountSupportsEnabledNetworks } from '../../../../../selectors/assets';
import {
  getAllEnabledNetworksForAllNamespaces,
  getEnabledNetworksByNamespace,
  selectEnabledNetworksAsCaipChainIds,
} from '../../../../../selectors/multichain/networks';
import { getNetworkConfigurationsByChainId } from '../../../../../../shared/lib/selectors/networks';
import {
  Box,
  ButtonBase,
  ButtonBaseSize,
  Icon,
  IconName,
  IconSize,
  Popover,
  PopoverPosition,
  Text,
} from '../../../../component-library';
import SortControl, { SelectableListItem } from '../sort-control/sort-control';
import {
  AlignItems,
  BackgroundColor,
  BorderColor,
  Display,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import ImportControl from '../import-control';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useAnalytics } from '../../../../../hooks/useAnalytics';
import { TEST_CHAINS } from '../../../../../../shared/constants/network';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../../shared/constants/metametrics';
import { getEnvironmentType } from '../../../../../../shared/lib/environment-type';
import {
  ENVIRONMENT_TYPE_NOTIFICATION,
  ENVIRONMENT_TYPE_POPUP,
} from '../../../../../../shared/constants/app';
import {
  checkAndUpdateAllNftsOwnershipStatus,
  detectNfts,
  detectTokens,
  refreshAssetsForSelectedAccount,
  setEnabledAllPopularNetworks,
  setTokenNetworkFilter,
  showImportNftsModal,
  showModal,
  updateBalancesFoAccounts,
} from '../../../../../store/actions';
import Tooltip from '../../../../ui/tooltip';
import {
  getMultichainIsEvm,
  getMultichainNetwork,
} from '../../../../../selectors/multichain';
import { useNftsCollections } from '../../../../../hooks/useNftsCollections';
import {
  ASSETS_ROUTE,
  TOKEN_MANAGEMENT_ROUTE,
} from '../../../../../helpers/constants/routes';
import { getIsAssetsUnifyStateEnabled } from '../../../../../selectors/assets-unify-state/feature-flags';
import { getIsNetworkManagementEnabled } from '../../../../../selectors/multichain/feature-flags';
import { useNetworkFilterButtonLabel } from '../../hooks/useNetworkFilterButtonLabel';
import { useAppDispatch } from '../../../../../store/hooks';
import { HomeNetworkFilterModal } from './home-network-filter-modal';

type AssetListControlBarProps = {
  showTokensLinks?: boolean;
  showImportTokenButton?: boolean;
  showSortControl?: boolean;
  onNetworkSelect?: (networks: string[]) => void;
};

const AssetListControlBar = ({
  showTokensLinks,
  showImportTokenButton = true,
  showSortControl = true,
  onNetworkSelect,
}: AssetListControlBarProps) => {
  const t = useI18nContext();
  const dispatch = useAppDispatch();
  const { trackEvent, createEventBuilder } = useAnalytics();
  const navigate = useNavigate();
  const sortButtonRef = useRef<HTMLButtonElement>(null);
  const importButtonRef = useRef<HTMLButtonElement>(null);
  const useNftDetection = useSelector(getUseNftDetection);
  const currentMultichainNetwork = useSelector(getMultichainNetwork);
  const allNetworks = useSelector(getNetworkConfigurationsByChainId);
  const isMainnet = useSelector(getIsMainnet);
  const isLineaMainnet = useSelector(getIsLineaMainnet);
  const allChainIds = useSelector(getAllChainsToPoll);
  const isEvm = useSelector(getMultichainIsEvm);
  const accountSupportsEnabledNetworks = useSelector(
    selectAccountSupportsEnabledNetworks,
  );
  const isAssetsUnifyStateEnabled = useSelector(getIsAssetsUnifyStateEnabled);
  const isNetworkManagementEnabled = useSelector(getIsNetworkManagementEnabled);
  const selectedInternalAccount = useSelector(getSelectedInternalAccount);

  const { collections } = useNftsCollections();

  const enabledNetworksByNamespace = useSelector(getEnabledNetworksByNamespace);
  const allEnabledNetworksForAllNamespaces = useSelector(
    getAllEnabledNetworksForAllNamespaces,
  );
  const selectedCaipChainIds = useSelector(selectEnabledNetworksAsCaipChainIds);
  const tokenNetworkFilter = useSelector(getTokenNetworkFilter);
  const [isNetworkFilterModalOpen, setIsNetworkFilterModalOpen] =
    useState(false);
  const [isTokenSortPopoverOpen, setIsTokenSortPopoverOpen] = useState(false);
  const [isImportTokensPopoverOpen, setIsImportTokensPopoverOpen] =
    useState(false);
  const [isImportNftPopoverOpen, setIsImportNftPopoverOpen] = useState(false);

  const allNetworkClientIds = useMemo(() => {
    return Object.keys(tokenNetworkFilter).flatMap((chainId) => {
      const entry = allNetworks[chainId as `0x${string}`];
      if (!entry) {
        return [];
      }
      const index = entry.defaultRpcEndpointIndex;
      const endpoint = entry.rpcEndpoints[index];
      return endpoint?.networkClientId ? [endpoint.networkClientId] : [];
    });
  }, [tokenNetworkFilter, allNetworks]);
  const currentNamespaceNetworkCount = Object.keys(
    enabledNetworksByNamespace,
  ).length;
  const totalEnabledNetworkCount = allEnabledNetworksForAllNamespaces.length;
  const isSingleNetworkFilterSelected = totalEnabledNetworkCount === 1;
  const networkButtonText = useNetworkFilterButtonLabel();

  const shouldShowRefreshButtons = useMemo(
    () =>
      (isMainnet || isLineaMainnet || Object.keys(collections).length > 0) &&
      useNftDetection,
    [isMainnet, isLineaMainnet, collections, useNftDetection],
  );

  const shouldShowEnableAutoDetect = useMemo(
    () => !shouldShowRefreshButtons && !useNftDetection,
    [shouldShowRefreshButtons, useNftDetection],
  );

  useEffect(() => {
    if (!onNetworkSelect) {
      return;
    }
    onNetworkSelect(selectedCaipChainIds);
  }, [onNetworkSelect, selectedCaipChainIds]);

  const isTestNetwork = useMemo(() => {
    return (TEST_CHAINS as string[]).includes(
      currentMultichainNetwork.network.chainId,
    );
  }, [currentMultichainNetwork.network.chainId]);

  const allOpts: Record<string, boolean> = useMemo(() => {
    const opts: Record<string, boolean> = {};
    Object.keys(allNetworks || {}).forEach((chainId) => {
      opts[chainId] = true;
    });
    return opts;
  }, [allNetworks]);

  useEffect(() => {
    if (isTestNetwork) {
      const testnetFilter = {
        [currentMultichainNetwork.network.chainId]: true,
      };
      dispatch(setTokenNetworkFilter(testnetFilter));
    }
  }, [isTestNetwork, currentMultichainNetwork.network.chainId, dispatch]);

  // TODO: This useEffect should be a migration
  // We need to set the default filter for all users to be all included networks, rather than defaulting to empty object
  // This effect is to unblock and derisk in the short-term
  useEffect(() => {
    if (currentNamespaceNetworkCount === 0) {
      dispatch(setTokenNetworkFilter(allOpts));
    } else {
      dispatch(
        setTokenNetworkFilter({
          [currentMultichainNetwork.network.chainId]: true,
        }),
      );
    }
  }, [
    allOpts,
    currentMultichainNetwork.network.chainId,
    dispatch,
    currentNamespaceNetworkCount,
  ]);

  useEffect(() => {
    if (!accountSupportsEnabledNetworks && totalEnabledNetworkCount > 0) {
      dispatch(setEnabledAllPopularNetworks());
    }
  }, [accountSupportsEnabledNetworks, totalEnabledNetworkCount, dispatch]);

  const windowType = getEnvironmentType();
  const isFullScreen =
    windowType !== ENVIRONMENT_TYPE_NOTIFICATION &&
    windowType !== ENVIRONMENT_TYPE_POPUP;

  const toggleTokenSortPopover = () => {
    setIsNetworkFilterModalOpen(false);
    setIsImportTokensPopoverOpen(false);
    setIsImportNftPopoverOpen(false);
    setIsTokenSortPopoverOpen(!isTokenSortPopoverOpen);
  };

  const toggleImportTokensPopover = () => {
    setIsNetworkFilterModalOpen(false);
    setIsTokenSortPopoverOpen(false);
    setIsImportNftPopoverOpen(false);
    setIsImportTokensPopoverOpen(!isImportTokensPopoverOpen);
  };

  const toggleImportNftPopover = () => {
    setIsNetworkFilterModalOpen(false);
    setIsTokenSortPopoverOpen(false);
    setIsImportTokensPopoverOpen(false);
    setIsImportNftPopoverOpen(!isImportNftPopoverOpen);
  };

  const closePopover = () => {
    setIsNetworkFilterModalOpen(false);
    setIsTokenSortPopoverOpen(false);
    setIsImportTokensPopoverOpen(false);
    setIsImportNftPopoverOpen(false);
  };

  const handleNetworkFilterClick = () => {
    if (!isNetworkManagementEnabled) {
      dispatch(showModal({ name: 'NETWORK_MANAGER' }));
      return;
    }

    setIsTokenSortPopoverOpen(false);
    setIsImportTokensPopoverOpen(false);
    setIsImportNftPopoverOpen(false);
    setIsNetworkFilterModalOpen(!isNetworkFilterModalOpen);
  };

  const handleOpenTokenManagement = useCallback(() => {
    trackEvent(
      createEventBuilder(MetaMetricsEventName.TokenImportButtonClicked)
        .addCategory(MetaMetricsEventCategory.Navigation)
        .addProperties({
          location: 'HOME',
        })
        .build(),
    );
    setIsTokenSortPopoverOpen(false);
    setIsImportTokensPopoverOpen(false);
    setIsImportNftPopoverOpen(false);
    navigate(TOKEN_MANAGEMENT_ROUTE, {
      state: {
        globalMenuTransition: 'forward',
      },
    });
  }, [createEventBuilder, navigate, trackEvent]);

  const handleNftImportModal = () => {
    dispatch(showImportNftsModal({}));
    closePopover();
  };

  const handleRefresh = () => {
    if (isAssetsUnifyStateEnabled && selectedInternalAccount) {
      dispatch(
        refreshAssetsForSelectedAccount([selectedInternalAccount], {
          chainIds: allEnabledNetworksForAllNamespaces,
          assetTypes: ['token', 'price', 'metadata'],
        }),
      );
    }
    dispatch(
      updateBalancesFoAccounts(Object.keys(enabledNetworksByNamespace), false),
    );
    dispatch(detectTokens(Object.keys(enabledNetworksByNamespace)));
    closePopover();
  };

  const onEnableAutoDetect = () => {
    navigate(`${ASSETS_ROUTE}#autodetect-tokens`);
  };

  const handleNftRefresh = () => {
    if (isMainnet || isLineaMainnet) {
      dispatch(detectNfts(allChainIds));
    }
    // loop through allNetworkClientIds and call checkAndUpdateAllNftsOwnershipStatus for each one
    allNetworkClientIds.forEach((networkClientId) => {
      checkAndUpdateAllNftsOwnershipStatus(networkClientId);
    });
  };

  return (
    <Box className="asset-list-control-bar" marginLeft={4} marginRight={4}>
      <Box display={Display.Flex} justifyContent={JustifyContent.spaceBetween}>
        <ButtonBase
          data-testid="sort-by-networks"
          variant={TextVariant.bodySmMedium}
          className="asset-list-control-bar__button asset-list-control-bar__network_control"
          onClick={handleNetworkFilterClick}
          size={ButtonBaseSize.Sm}
          startIconName={IconName.Filter}
          startIconProps={{ marginInlineEnd: 1, size: IconSize.Md }}
          backgroundColor={
            isNetworkFilterModalOpen
              ? BackgroundColor.backgroundPressed
              : BackgroundColor.backgroundDefault
          }
          color={
            isSingleNetworkFilterSelected
              ? TextColor.primaryDefault
              : TextColor.textDefault
          }
          marginRight={isFullScreen ? 2 : null}
          borderColor={BorderColor.borderMuted}
          ellipsis
        >
          <Box display={Display.Flex} alignItems={AlignItems.center} gap={2}>
            <Text
              variant={TextVariant.bodySmMedium}
              color={
                isSingleNetworkFilterSelected
                  ? TextColor.primaryDefault
                  : TextColor.textDefault
              }
              ellipsis
            >
              {networkButtonText}
            </Text>
          </Box>
        </ButtonBase>

        <Box
          className="asset-list-control-bar__buttons"
          display={Display.Flex}
          justifyContent={JustifyContent.flexEnd}
          alignItems={AlignItems.center}
        >
          {showSortControl && (
            <Tooltip
              title={t('sortBy')}
              position="bottom"
              distance={20}
              disabled={isTokenSortPopoverOpen}
            >
              <DsButtonIcon
                ref={sortButtonRef}
                data-testid="sort-by-popover-toggle"
                className={`asset-list-control-bar__button flex items-center justify-center border-0 ${
                  isTokenSortPopoverOpen ? 'bg-pressed' : 'bg-transparent'
                } hover:bg-hover active:bg-pressed`}
                onClick={toggleTokenSortPopover}
                size={DsButtonIconSize.Sm}
                iconName={DsIconName.ListArrow}
                ariaLabel={t('sortBy')}
              />
            </Tooltip>
          )}

          {showImportTokenButton &&
            (isEvm ? (
              <ImportControl
                ref={importButtonRef}
                showTokensLinks={showTokensLinks}
                onClick={
                  showTokensLinks
                    ? toggleImportTokensPopover
                    : toggleImportNftPopover
                }
              />
            ) : (
              <Tooltip
                title={t('manageTokens')}
                position="bottom"
                distance={20}
              >
                <DsButtonIcon
                  ref={importButtonRef}
                  data-testid="importTokens-button"
                  className="asset-list-control-bar__button flex items-center justify-center border-0 bg-transparent hover:bg-hover active:bg-pressed"
                  onClick={handleOpenTokenManagement}
                  size={DsButtonIconSize.Sm}
                  iconName={DsIconName.MoreVertical}
                  ariaLabel={t('manageTokens')}
                />
              </Tooltip>
            ))}
        </Box>
      </Box>

      {isNetworkManagementEnabled && (
        <HomeNetworkFilterModal
          isOpen={isNetworkFilterModalOpen}
          onClose={closePopover}
        />
      )}

      <Popover
        onClickOutside={closePopover}
        isOpen={isTokenSortPopoverOpen}
        position={PopoverPosition.BottomEnd}
        referenceElement={sortButtonRef.current}
        matchWidth={false}
        style={{
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          minWidth: isFullScreen ? '250px' : '',
        }}
      >
        <SortControl handleClose={closePopover} />
      </Popover>

      {/* Tokens Popover */}
      <Popover
        onClickOutside={closePopover}
        isOpen={isImportTokensPopoverOpen}
        position={PopoverPosition.BottomEnd}
        referenceElement={importButtonRef.current}
        matchWidth={false}
        style={{
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          minWidth: isFullScreen ? '158px' : '',
        }}
      >
        <SelectableListItem
          onClick={handleOpenTokenManagement}
          testId="manageTokens"
          className="min-h-12"
        >
          <Icon
            name={IconName.Setting}
            size={IconSize.Sm}
            marginInlineEnd={2}
          />
          {t('manageTokens')}
        </SelectableListItem>
        <SelectableListItem onClick={handleRefresh} testId="refreshList">
          <Icon
            name={IconName.Refresh}
            size={IconSize.Sm}
            marginInlineEnd={2}
          />
          {t('refreshList')}
        </SelectableListItem>
      </Popover>

      {/* NFT Popover */}
      <Popover
        onClickOutside={closePopover}
        isOpen={isImportNftPopoverOpen}
        position={PopoverPosition.BottomEnd}
        referenceElement={importButtonRef.current}
        matchWidth={false}
        style={{
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          minWidth: isFullScreen ? '158px' : '',
        }}
      >
        <SelectableListItem onClick={handleNftImportModal} testId="import-nfts">
          <Icon name={IconName.Add} size={IconSize.Sm} marginInlineEnd={2} />

          {t('importNFT')}
        </SelectableListItem>

        <Box className="nfts-tab__link" justifyContent={JustifyContent.flexEnd}>
          {shouldShowRefreshButtons && (
            <SelectableListItem
              onClick={handleNftRefresh}
              testId="refresh-list-button"
            >
              <Icon
                name={IconName.Refresh}
                size={IconSize.Sm}
                marginInlineEnd={2}
              />

              {t('refreshList')}
            </SelectableListItem>
          )}
          {shouldShowEnableAutoDetect && (
            <SelectableListItem
              onClick={onEnableAutoDetect}
              testId="enable-autodetect-button"
            >
              <Icon
                name={IconName.Setting}
                size={IconSize.Sm}
                marginInlineEnd={2}
              />

              {t('enableAutoDetect')}
            </SelectableListItem>
          )}
        </Box>
      </Popover>
    </Box>
  );
};

export default AssetListControlBar;
