import React, { useMemo } from 'react';
import classNames from 'clsx';
import {
  BackgroundColor,
  BorderColor,
} from '../../../helpers/constants/design-system';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
} from '@metamask/design-system-react';
import { BadgeWrapper } from '../../component-library';
import { PreferredAvatar } from '../../app/preferred-avatar';
import Tooltip from '../../ui/tooltip';

import { BadgeStatusProps } from './badge-status.types';

const TooltipStyle = { display: 'flex' };

export const BadgeStatus: React.FC<BadgeStatusProps> = ({
  className = '',
  hideTooltip = false,
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
              className={classNames(
                'multichain-badge-status__badge rounded-full',
                {
                  'multichain-badge-status__badge-not-connected':
                    isConnectedAndNotActive,
                },
              )}
              borderWidth={2}
              style={{
                backgroundColor: `var(--color-${badgeBackgroundColor})`,
                borderColor: `var(--color-${badgeBorderColor})`,
              }}
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
      asChild
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      justifyContent={BoxJustifyContent.Center}
    >
      <button
        type="button"
        data-testid="multichain-badge-status"
        className={classNames(
          'multichain-badge-status pr-1 bg-transparent',
          className,
        )}
        {...props}
      >
      {showConnectedStatus && !hideTooltip ? (
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
      </button>
    </Box>
  );
};
