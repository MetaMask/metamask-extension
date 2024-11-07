import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  getCurrentNetwork,
  getNetworkConfigurationsByChainId,
  getPreferences,
} from '../../../../../selectors';
import {
  Box,
  ButtonBase,
  ButtonBaseSize,
  IconName,
  Popover,
  PopoverPosition,
} from '../../../../component-library';
import SortControl from '../sort-control';
import {
  BackgroundColor,
  Display,
  JustifyContent,
  TextColor,
} from '../../../../../helpers/constants/design-system';
import ImportControl from '../import-control';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../../../../../../app/scripts/lib/util';
import {
  ENVIRONMENT_TYPE_NOTIFICATION,
  ENVIRONMENT_TYPE_POPUP,
} from '../../../../../../shared/constants/app';
import NetworkFilter from '../network-filter';
import { setTokenNetworkFilter } from '../../../../../store/actions';
import Tooltip from '../../../../ui/tooltip';

type AssetListControlBarProps = {
  showTokensLinks?: boolean;
};

const AssetListControlBar = ({ showTokensLinks }: AssetListControlBarProps) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const popoverRef = useRef<HTMLDivElement>(null);
  const currentNetwork = useSelector(getCurrentNetwork);
  const allNetworks = useSelector(getNetworkConfigurationsByChainId);
  const { tokenNetworkFilter } = useSelector(getPreferences);
  const [isTokenSortPopoverOpen, setIsTokenSortPopoverOpen] = useState(false);
  const [isNetworkFilterPopoverOpen, setIsNetworkFilterPopoverOpen] =
    useState(false);

  const allOpts: Record<string, boolean> = {};
  Object.keys(allNetworks).forEach((chainId) => {
    allOpts[chainId] = true;
  });

  const allNetworksFilterShown =
    Object.keys(tokenNetworkFilter).length !== Object.keys(allOpts).length;

  // TODO: This useEffect should be a migration
  // We need to set the default filter for all users to be all included networks, rather than defaulting to empty object
  // This effect is to unblock and derisk in the short-term
  useEffect(() => {
    if (Object.keys(tokenNetworkFilter).length === 0) {
      dispatch(setTokenNetworkFilter(allOpts));
    }
  }, []);

  const windowType = getEnvironmentType();
  const isFullScreen =
    windowType !== ENVIRONMENT_TYPE_NOTIFICATION &&
    windowType !== ENVIRONMENT_TYPE_POPUP;

  const toggleTokenSortPopover = () => {
    setIsNetworkFilterPopoverOpen(false);
    setIsTokenSortPopoverOpen(!isTokenSortPopoverOpen);
  };

  const toggleNetworkFilterPopover = () => {
    setIsTokenSortPopoverOpen(false);
    setIsNetworkFilterPopoverOpen(!isNetworkFilterPopoverOpen);
  };

  const closePopover = () => {
    setIsTokenSortPopoverOpen(false);
    setIsNetworkFilterPopoverOpen(false);
  };

  return (
    <Box
      className="asset-list-control-bar"
      marginLeft={2}
      marginRight={2}
      ref={popoverRef}
    >
      <Box display={Display.Flex} justifyContent={JustifyContent.spaceBetween}>
        {process.env.FILTER_TOKENS_TOGGLE && (
          <ButtonBase
            data-testid="sort-by-popover-toggle"
            className="asset-list-control-bar__button asset-list-control-bar__network_control"
            onClick={toggleNetworkFilterPopover}
            size={ButtonBaseSize.Sm}
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

        <Box display={Display.Flex} justifyContent={JustifyContent.flexEnd}>
          <Tooltip title={t('sortBy')} position="bottom" distance={20}>
            <ButtonBase
              data-testid="sort-by-popover-toggle"
              className="asset-list-control-bar__button"
              onClick={toggleTokenSortPopover}
              size={ButtonBaseSize.Sm}
              endIconName={IconName.SwapVertical}
              backgroundColor={
                isTokenSortPopoverOpen
                  ? BackgroundColor.backgroundPressed
                  : BackgroundColor.backgroundDefault
              }
              color={TextColor.textDefault}
              marginRight={isFullScreen ? 2 : null}
            />
          </Tooltip>

          <Tooltip title={t('importTokens')} position="bottom" distance={20}>
            <ImportControl showTokensLinks={showTokensLinks} />
          </Tooltip>
        </Box>
      </Box>

      <Popover
        onClickOutside={closePopover}
        isOpen={isNetworkFilterPopoverOpen}
        position={PopoverPosition.BottomStart}
        referenceElement={popoverRef.current}
        matchWidth={!isFullScreen}
        style={{
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          minWidth: isFullScreen ? '325px' : '',
        }}
      >
        <NetworkFilter handleClose={closePopover} />
      </Popover>
      <Popover
        onClickOutside={closePopover}
        isOpen={isTokenSortPopoverOpen}
        position={PopoverPosition.BottomEnd}
        referenceElement={popoverRef.current}
        matchWidth={!isFullScreen}
        style={{
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          minWidth: isFullScreen ? '325px' : '',
        }}
      >
        <SortControl handleClose={closePopover} />
      </Popover>
    </Box>
  );
};

export default AssetListControlBar;
