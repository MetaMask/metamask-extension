import React, { useEffect, useRef, useState, useContext, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getCurrentNetwork, getPreferences } from '../../../../../selectors';
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
import SortControl, { SelectableListItem } from '../sort-control/sort-control';
import {
  BackgroundColor,
  Display,
  JustifyContent,
  TextColor,
  TextVariant,
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
import NetworkFilter from '../network-filter';
import {
  detectTokens,
  setTokenNetworkFilter,
  showImportTokensModal,
} from '../../../../../store/actions';
import Tooltip from '../../../../ui/tooltip';

type AssetListControlBarProps = {
  showTokensLinks?: boolean;
};

const AssetListControlBar = ({ showTokensLinks }: AssetListControlBarProps) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);
  const popoverRef = useRef<HTMLDivElement>(null);
  const currentNetwork = useSelector(getCurrentNetwork);
  const allNetworks = useSelector(getNetworkConfigurationsByChainId);

  const { tokenNetworkFilter } = useSelector(getPreferences);
  const [isTokenSortPopoverOpen, setIsTokenSortPopoverOpen] = useState(false);
  const [isImportTokensPopoverOpen, setIsImportTokensPopoverOpen] =
    useState(false);
  const [isNetworkFilterPopoverOpen, setIsNetworkFilterPopoverOpen] =
    useState(false);

  const isTestNetwork = useMemo(() => {
    return (TEST_CHAINS as string[]).includes(currentNetwork.chainId);
  }, [currentNetwork.chainId, TEST_CHAINS]);

  const allOpts: Record<string, boolean> = {};
  Object.keys(allNetworks || {}).forEach((chainId) => {
    allOpts[chainId] = true;
  });

  const allNetworksFilterShown =
    Object.keys(tokenNetworkFilter || {}).length !==
    Object.keys(allOpts || {}).length;

  useEffect(() => {
    if (isTestNetwork) {
      const testnetFilter = { [currentNetwork.chainId]: true };
      dispatch(setTokenNetworkFilter(testnetFilter));
    }
  }, [isTestNetwork, currentNetwork.chainId, dispatch]);

  // TODO: This useEffect should be a migration
  // We need to set the default filter for all users to be all included networks, rather than defaulting to empty object
  // This effect is to unblock and derisk in the short-term
  useEffect(() => {
    if (
      process.env.PORTFOLIO_VIEW &&
      Object.keys(tokenNetworkFilter || {}).length === 0
    ) {
      dispatch(setTokenNetworkFilter(allOpts));
    } else {
      dispatch(setTokenNetworkFilter({ [currentNetwork.chainId]: true }));
    }
  }, []);

  // When a network gets added/removed we want to make sure that we switch to the filtered list of the current network
  // We only want to do this if the "Current Network" filter is selected
  useEffect(() => {
    if (Object.keys(tokenNetworkFilter).length === 1) {
      dispatch(setTokenNetworkFilter({ [currentNetwork.chainId]: true }));
    }
  }, [Object.keys(allNetworks).length]);

  const windowType = getEnvironmentType();
  const isFullScreen =
    windowType !== ENVIRONMENT_TYPE_NOTIFICATION &&
    windowType !== ENVIRONMENT_TYPE_POPUP;

  const toggleTokenSortPopover = () => {
    setIsNetworkFilterPopoverOpen(false);
    setIsImportTokensPopoverOpen(false);
    setIsTokenSortPopoverOpen(!isTokenSortPopoverOpen);
  };

  const toggleNetworkFilterPopover = () => {
    setIsTokenSortPopoverOpen(false);
    setIsImportTokensPopoverOpen(false);
    setIsNetworkFilterPopoverOpen(!isNetworkFilterPopoverOpen);
  };

  const toggleImportTokensPopover = () => {
    setIsTokenSortPopoverOpen(false);
    setIsNetworkFilterPopoverOpen(false);
    setIsImportTokensPopoverOpen(!isImportTokensPopoverOpen);
  };

  const closePopover = () => {
    setIsTokenSortPopoverOpen(false);
    setIsNetworkFilterPopoverOpen(false);
    setIsImportTokensPopoverOpen(false);
  };

  const handleImport = () => {
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

  const handleRefresh = () => {
    dispatch(detectTokens());
    closePopover();
  };

  return (
    <Box
      className="asset-list-control-bar"
      marginLeft={2}
      marginRight={2}
      ref={popoverRef}
    >
      <Box
        display={Display.Flex}
        justifyContent={
          process.env.PORTFOLIO_VIEW
            ? JustifyContent.spaceBetween
            : JustifyContent.flexEnd
        }
      >
        {process.env.PORTFOLIO_VIEW && (
          <ButtonBase
            data-testid="sort-by-networks"
            variant={TextVariant.bodyMdMedium}
            className="asset-list-control-bar__button asset-list-control-bar__network_control"
            onClick={toggleNetworkFilterPopover}
            size={ButtonBaseSize.Sm}
            disabled={isTestNetwork}
            endIconName={IconName.ArrowDown}
            backgroundColor={
              isNetworkFilterPopoverOpen
                ? BackgroundColor.backgroundPressed
                : BackgroundColor.backgroundDefault
            }
            color={TextColor.textDefault}
            marginRight={isFullScreen ? 2 : null}
            ellipsis
          >
            {allNetworksFilterShown
              ? currentNetwork?.nickname ?? t('currentNetwork')
              : t('allNetworks')}
          </ButtonBase>
        )}

        <Box
          className="asset-list-control-bar__buttons"
          display={Display.Flex}
          justifyContent={JustifyContent.flexEnd}
        >
          <Tooltip title={t('sortBy')} position="bottom" distance={20}>
            <ButtonBase
              data-testid="sort-by-popover-toggle"
              className="asset-list-control-bar__button"
              onClick={toggleTokenSortPopover}
              size={ButtonBaseSize.Sm}
              startIconName={IconName.Filter}
              startIconProps={{ marginInlineEnd: 0 }}
              backgroundColor={
                isTokenSortPopoverOpen
                  ? BackgroundColor.backgroundPressed
                  : BackgroundColor.backgroundDefault
              }
              color={TextColor.textDefault}
              marginRight={isFullScreen ? 2 : null}
            />
          </Tooltip>

          <ImportControl
            showTokensLinks={showTokensLinks}
            onClick={toggleImportTokensPopover}
          />
        </Box>
      </Box>

      <Popover
        onClickOutside={closePopover}
        isOpen={isNetworkFilterPopoverOpen}
        position={PopoverPosition.BottomStart}
        referenceElement={popoverRef.current}
        matchWidth={false}
        style={{
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          minWidth: isFullScreen ? '250px' : '',
        }}
      >
        <NetworkFilter handleClose={closePopover} />
      </Popover>
      <Popover
        onClickOutside={closePopover}
        isOpen={isTokenSortPopoverOpen}
        position={PopoverPosition.BottomEnd}
        referenceElement={popoverRef.current}
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

      <Popover
        onClickOutside={closePopover}
        isOpen={isImportTokensPopoverOpen}
        position={PopoverPosition.BottomEnd}
        referenceElement={popoverRef.current}
        matchWidth={false}
        style={{
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          minWidth: isFullScreen ? '158px' : '',
        }}
      >
        <SelectableListItem onClick={handleImport} testId="importTokens">
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
    </Box>
  );
};

export default AssetListControlBar;
