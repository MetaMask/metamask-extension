import React from 'react';
import classnames from 'classnames';

import { Display } from '../../../helpers/constants/design-system';

import { Box, type BoxProps, type PolymorphicRef } from '../box';
import {
  BadgeWrapperPosition,
  BadgeWrapperAnchorElementShape,
  BadgeWrapperProps,
  BadgeWrapperComponent,
} from './badge-wrapper.types';

export const BadgeWrapper: BadgeWrapperComponent = React.forwardRef(
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  <C extends React.ElementType = 'div'>(
    {
      children,
      badge,
      badgeContainerProps,
      position = BadgeWrapperPosition.bottomRight,
      positionObj,
      anchorElementShape = BadgeWrapperAnchorElementShape.rectangular,
      className = '',
      ...props
    }: BadgeWrapperProps<C>,
    ref?: PolymorphicRef<C>,
  ) => (
    <Box
      className={classnames('mm-badge-wrapper', className)}
      ref={ref}
      display={Display.InlineBlock}
      {...(props as BoxProps<C>)}
    >
      {/* Generally the AvatarAccount or AvatarToken */}
      {children}
      <Box
        {...badgeContainerProps}
        className={classnames(
          'mm-badge-wrapper__badge-container',
          {
            [`mm-badge-wrapper__badge-container--${anchorElementShape}-${position}`]:
              !positionObj,
          },
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          badgeContainerProps?.className || '',
        )}
        style={{ ...positionObj }}
      >
        {/* Generally the AvatarNetwork at SIZES.XS */}
        {badge}
      </Box>
    </Box>
  ),
);
