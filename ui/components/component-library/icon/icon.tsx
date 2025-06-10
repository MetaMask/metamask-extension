import React from 'react';
import classnames from 'classnames';

import { IconColor, Display } from '../../../helpers/constants/design-system';

import { Box, BoxProps } from '../box';
import type { PolymorphicRef } from '../box';

import { IconSize, IconProps, IconComponent } from './icon.types';

export const Icon: IconComponent = React.forwardRef(
  <C extends React.ElementType = 'span'>(
    {
      name,
      size = IconSize.Md,
      color = IconColor.inherit,
      className = '',
      style,
      ...props
    }: IconProps<C>,
    ref?: PolymorphicRef<C>,
  ) => (
    <Box
      className={classnames(className, 'mm-icon', `mm-icon--size-${size}`)}
      ref={ref}
      as="span"
      display={Display.InlineBlock}
      color={color}
      style={{
        /**
         * To reduce the possibility of injection attacks
         * the icon component uses mask-image instead of rendering
         * the svg directly.
         */
        maskImage: `url('./images/icons/${String(name)}.svg')`,
        WebkitMaskImage: `url('./images/icons/${String(name)}.svg')`,
        ...style,
      }}
      {...(props as BoxProps<C>)}
    />
  ),
);
