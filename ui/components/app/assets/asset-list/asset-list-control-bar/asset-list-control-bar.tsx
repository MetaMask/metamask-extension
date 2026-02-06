import React, { useEffect, useRef, useState, useContext, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  getAllChainsToPoll,
  getIsLineaMainnet,
  getIsMainnet,
  getTokenNetworkFilter,
  getUseNftDetection,
} from '../../../../../selectors';
import { selectAccountSupportsEnabledNetworks } from '../../../../../selectors/assets';
import {
  getAllEnabledNetworksForAllNamespaces,
  getEnabledNetworksByNamespace,
} from '../../../../../selectors/multichain/networks';
import { getNetworkConfigurationsByChainId } from '../../../../../../shared/modules/selectors/networks';
import {
  Box,
  ButtonBase,
  ButtonBaseSize,
  Icon,
  IconName,
  IconSize,
  Popover,
  PopoverPosition,
} from '../../../../component-library';
import { SelectableListItem } from '../sort-control/sort-control';
import {
  BackgroundColor,
  Display,
  JustifyContent,
  TextColor,
} from '../../../../../helpers/constants/design-system';
import ImportControl from '../import-control';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../../../../contexts/metametrics';
import { TEST_CHAINS } from '../../../../../../shared/constants/network';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../../shared/constants/metametrics';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../../../../../../app/scripts/lib/util';
import {
  ENVIRONMENT_TYPE_NOTIFICATION,
  ENVIRONMENT_TYPE_POPUP,
} from '../../../../../../shared/constants/app';
import {
  checkAndUpdateAllNftsOwnershipStatus,
  detectNfts,
  detectTokens,
  setEnabledAllPopularNetworks,
  setTokenNetworkFilter,
  showImportNftsModal,
  showImportTokensModal,
  updateBalancesFoAccounts,
} from '../../../../../store/actions';
import Tooltip from '../../../../ui/tooltip';
import {
  getMultichainIsEvm,
  getMultichainNetwork,
} from '../../../../../selectors/multichain';
import { useNftsCollections } from '../../../../../hooks/useNftsCollections';
import { SECURITY_ROUTE } from '../../../../../helpers/constants/routes';

type AssetListControlBarProps = {
  showTokensLinks?: boolean;
  showImportTokenButton?: boolean;
};

const AssetListControlBar = ({
  showTokensLinks,
  showImportTokenButton = true,
}: AssetListControlBarProps) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { trackEvent } = useContext(MetaMetricsContext);
  const navigate = useNavigate();
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

  const { collections } = useNftsCollections();

  const enabledNetworksByNamespace = useSelector(getEnabledNetworksByNamespace);
  const allEnabledNetworksForAllNamespaces = useSelector(
    getAllEnabledNetworksForAllNamespaces,
  );
  const tokenNetworkFilter = useSelector(getTokenNetworkFilter);
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

  const toggleImportTokensPopover = () => {
    setIsImportNftPopoverOpen(false);
    setIsImportTokensPopoverOpen(!isImportTokensPopoverOpen);
  };

  const toggleImportNftPopover = () => {
    setIsImportTokensPopoverOpen(false);
    setIsImportNftPopoverOpen(!isImportNftPopoverOpen);
  };

  const closePopover = () => {
    setIsImportTokensPopoverOpen(false);
    setIsImportNftPopoverOpen(false);
  };

  const handleTokenImportModal = () => {
    dispatch(showImportTokensModal());
    trackEvent({
      category: MetaMetricsEventCategory.Navigation,
      event: MetaMetricsEventName.TokenImportButtonClicked,
      properties: {
        location: 'HOME',
      },
    });
    closePopover();
  };

  const handleNftImportModal = () => {
    dispatch(showImportNftsModal({}));
    closePopover();
  };

  const handleRefresh = () => {
    dispatch(
      updateBalancesFoAccounts(Object.keys(enabledNetworksByNamespace), false),
    );
    dispatch(detectTokens(Object.keys(enabledNetworksByNamespace)));
    closePopover();
  };

  const onEnableAutoDetect = () => {
    navigate(SECURITY_ROUTE);
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
      <Box display={Display.Flex} justifyContent={JustifyContent.flexEnd}>
        <Box
          className="asset-list-control-bar__buttons"
          display={Display.Flex}
          justifyContent={JustifyContent.flexEnd}
        >
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
                title={t('importTokensCamelCase')}
                position="bottom"
                distance={20}
              >
                <ButtonBase
                  ref={importButtonRef}
                  data-testid="importTokens-button"
                  className="asset-list-control-bar__button"
                  onClick={handleTokenImportModal}
                  size={ButtonBaseSize.Sm}
                  startIconName={IconName.Add}
                  startIconProps={{ marginInlineEnd: 0, size: IconSize.Md }}
                  backgroundColor={BackgroundColor.backgroundDefault}
                  color={TextColor.textDefault}
                  marginRight={isFullScreen ? 2 : null}
                />
              </Tooltip>
            ))}
        </Box>
      </Box>

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
          onClick={handleTokenImportModal}
          testId="importTokens"
        >
          <Icon name={IconName.Add} size={IconSize.Sm} marginInlineEnd={2} />
          {t('importTokensCamelCase')}
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
