import React, { useMemo } from 'react';
import classNames from 'classnames';
import {
  AlignItems,
  BackgroundColor,
  BorderColor,
  BorderRadius,
  Display,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import { BadgeWrapper, Box, BoxProps } from '../../component-library';
import { PreferredAvatar } from '../../app/preferred-avatar';
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
  const tooltipContents = useMemo(() => {
    let positionObj;
    if (showConnectedStatus) {
      positionObj = isConnectedAndNotActive
        ? { bottom: '-4%', right: '-12%' }
        : { bottom: '-10%', right: '-20%' };
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
        {<PreferredAvatar address={address} className="flex" />}
      </BadgeWrapper>
    );
  }, [
    address,
    badgeBackgroundColor,
    badgeBorderColor,
    isConnectedAndNotActive,
    showConnectedStatus,
  ]);

  return (
    <Box
      className={classNames('multichain-badge-status pr-1', className)}
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
