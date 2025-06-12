import React, { useMemo } from 'react';
import classNames from 'classnames';
import { useSelector } from 'react-redux';
import {
  AlignItems,
  BackgroundColor,
  BorderColor,
  BorderRadius,
  Display,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import {
  AvatarAccount,
  AvatarAccountSize,
  AvatarAccountVariant,
  BadgeWrapper,
  Box,
  BoxProps,
} from '../../component-library';
import { getUseBlockie } from '../../../selectors';
import Tooltip from '../../ui/tooltip';

import { BadgeStatusProps } from './badge-status.types';

const TooltipStyle = { display: 'flex' };

export const BadgeStatus: React.FC<BadgeStatusProps> = ({
  className = '',
  badgeBackgroundColor = BackgroundColor.backgroundAlternative,
  badgeBorderColor = BorderColor.borderMuted,
  address,
  isConnectedAndNotActive = false,
  showConnectedStatus = true,
  text,
  ...props
}): JSX.Element => {
  const useBlockie = useSelector(getUseBlockie);
  const tooltipContents = useMemo(() => {
    let positionObj;
    if (showConnectedStatus) {
      positionObj = isConnectedAndNotActive
        ? { bottom: 2, right: 5 }
        : { bottom: -1, right: 2 };
    }

    return (
      <BadgeWrapper
        positionObj={positionObj}
        badge={
          showConnectedStatus && (
            <Box
              className={classNames('multichain-badge-status__badge', {
                'multichain-badge-status__badge-not-connected':
                  isConnectedAndNotActive,
              })}
              backgroundColor={badgeBackgroundColor}
              borderRadius={BorderRadius.full}
              borderColor={badgeBorderColor}
              borderWidth={2}
            />
          )
        }
      >
        {
          <AvatarAccount
            borderColor={BorderColor.transparent}
            size={AvatarAccountSize.Md}
            address={address}
            variant={
              useBlockie
                ? AvatarAccountVariant.Blockies
                : AvatarAccountVariant.Jazzicon
            }
            marginInlineEnd={2}
          />
        }
      </BadgeWrapper>
    );
  }, [
    address,
    badgeBackgroundColor,
    badgeBorderColor,
    isConnectedAndNotActive,
    useBlockie,
    showConnectedStatus,
  ]);

  return (
    <Box
      className={classNames('multichain-badge-status', className)}
      data-testid="multichain-badge-status"
      as="button"
      display={Display.Flex}
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.center}
      backgroundColor={BackgroundColor.transparent}
      {...(props as BoxProps<'div'>)}
    >
      {showConnectedStatus ? (
        <Tooltip
          style={TooltipStyle}
          title={text}
          data-testid="multichain-badge-status__tooltip"
          position="bottom"
        >
          {tooltipContents}
        </Tooltip>
      ) : (
        tooltipContents
      )}
    </Box>
  );
};
