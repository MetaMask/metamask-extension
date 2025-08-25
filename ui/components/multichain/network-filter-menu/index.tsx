import React, { useRef } from 'react';
import { IconName } from '../../component-library/icon';
import {
  BackgroundColor,
  JustifyContent,
  TextColor,
} from '../../../helpers/constants/design-system';
import {
  ButtonBase,
  ButtonBaseSize,
} from '../../component-library/button-base';
import { Popover, PopoverPosition } from '../../component-library/popover';
import { Box } from '../../component-library';
import { FEATURED_NETWORK_CHAIN_IDS } from '../../../../shared/constants/network';
import NetworkFilter from '../../app/assets/asset-list/network-filter';
import { useI18nContext } from '../../../hooks/useI18nContext';

export const NetworkFilterComponent = ({
  isFullScreen,
  toggleNetworkFilterPopover,
  isTestNetwork,
  currentNetworkConfig,
  isNetworkFilterPopoverOpen,
  closePopover,
  isTokenNetworkFilterEqualCurrentNetwork,
}: {
  isFullScreen: boolean;
  toggleNetworkFilterPopover: () => void;
  isTestNetwork: boolean;
  currentNetworkConfig: {
    chainId: string;
    nickname: string;
  };
  isNetworkFilterPopoverOpen: boolean;
  closePopover: () => void;
  isTokenNetworkFilterEqualCurrentNetwork: boolean;
}) => {
  const popoverRef = useRef(null);
  const t = useI18nContext();

  return (
    <Box
      marginLeft={2}
      marginRight={2}
      justifyContent={
        isFullScreen ? JustifyContent.flexStart : JustifyContent.spaceBetween
      }
      ref={popoverRef}
    >
      <ButtonBase
        data-testid="sort-by-popover-toggle"
        className="asset-list-control-bar__button asset-list-control-bar__network_control"
        onClick={toggleNetworkFilterPopover}
        size={ButtonBaseSize.Sm}
        disabled={
          isTestNetwork ||
          !FEATURED_NETWORK_CHAIN_IDS.includes(
            currentNetworkConfig.chainId as `0x${string}`,
          )
        }
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
        {isTokenNetworkFilterEqualCurrentNetwork
          ? (currentNetworkConfig?.nickname ?? t('currentNetwork'))
          : t('popularNetworks')}
      </ButtonBase>

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
    </Box>
  );
};

export default NetworkFilterComponent;
