import React from 'react';
import classnames from 'classnames';

import { DISPLAY } from '../../../helpers/constants/design-system';

import Box from '../../ui/box';

import {
  BadgeWrapperPosition,
  BadgeWrapperAnchorElementShape,
  BadgeWrapperProps,
} from './badge-wrapper.types';

export const BadgeWrapper = ({
  children,
  badge,
  badgeContainerProps,
  position = BadgeWrapperPosition.topRight,
  positionObj,
  anchorElementShape = BadgeWrapperAnchorElementShape.circular,
  className = '',
  color,
  ...props
}: BadgeWrapperProps) => (
  <Box
    className={classnames('mm-badge-wrapper', className)}
    display={DISPLAY.INLINE_BLOCK}
    {...props}
  >
    {/* Generally the AvatarAccount or AvatarToken */}
    {children}
    <Box
      className={classnames('mm-badge-wrapper__badge-container', {
        [`mm-badge-wrapper__badge-container--${anchorElementShape}-${position}`]:
          !positionObj,
      })}
      style={{ ...positionObj }}
      {...badgeContainerProps}
    >
      {/* Generally the AvatarNetwork at SIZES.XS */}
      {badge}
    </Box>
  </Box>
);
