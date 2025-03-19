import React, { useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { getCurrentNetwork, getPreferences } from '../../../../../selectors';
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
  BorderColor,
  BorderStyle,
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

type AssetListControlBarProps = {
  showTokensLinks?: boolean;
};

const AssetListControlBar = ({ showTokensLinks }: AssetListControlBarProps) => {
  const t = useI18nContext();
  const popoverRef = useRef<HTMLDivElement>(null);
  const currentNetwork = useSelector(getCurrentNetwork);
  const { tokenNetworkFilter } = useSelector(getPreferences);
  const [isTokenSortPopoverOpen, setIsTokenSortPopoverOpen] = useState(false);
  const [isNetworkFilterPopoverOpen, setIsNetworkFilterPopoverOpen] =
    useState(false);

  const allNetworksFilterShown = Object.keys(tokenNetworkFilter ?? {}).length;

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
      marginLeft={4}
      marginRight={4}
      paddingTop={4}
      ref={popoverRef}
    >
      <Box
        display={Display.Flex}
        justifyContent={
          isFullScreen ? JustifyContent.flexStart : JustifyContent.spaceBetween
        }
      >
        {process.env.FILTER_TOKENS_TOGGLE && (
          <ButtonBase
            data-testid="sort-by-popover-toggle"
            className="asset-list-control-bar__button"
            onClick={toggleNetworkFilterPopover}
            size={ButtonBaseSize.Sm}
            endIconName={IconName.ArrowDown}
            backgroundColor={
              isNetworkFilterPopoverOpen
                ? BackgroundColor.backgroundPressed
                : BackgroundColor.backgroundDefault
            }
            borderColor={BorderColor.borderMuted}
            borderStyle={BorderStyle.solid}
            color={TextColor.textDefault}
            marginRight={isFullScreen ? 2 : null}
            ellipsis
          >
            {allNetworksFilterShown
              ? currentNetwork?.nickname ?? t('currentNetwork')
              : t('allNetworks')}
          </ButtonBase>
        )}

        <ButtonBase
          data-testid="sort-by-popover-toggle"
          className="asset-list-control-bar__button"
          onClick={toggleTokenSortPopover}
          size={ButtonBaseSize.Sm}
          endIconName={IconName.ArrowDown}
          backgroundColor={
            isTokenSortPopoverOpen
              ? BackgroundColor.backgroundPressed
              : BackgroundColor.backgroundDefault
          }
          borderColor={BorderColor.borderMuted}
          borderStyle={BorderStyle.solid}
          color={TextColor.textDefault}
          marginRight={isFullScreen ? 2 : null}
        >
          {t('sortBy')}
        </ButtonBase>

        <ImportControl showTokensLinks={showTokensLinks} />
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
        <SortControl handleClose={closePopover} />
      </Popover>
    </Box>
  );
};

export default AssetListControlBar;
