import React from 'react';
import classnames from 'classnames';

import Box from '../../ui/box/box';

import { IconColor, Display } from '../../../helpers/constants/design-system';

import { IconProps, IconSize } from './icon.types';

export const Icon = ({
  name,
  size = IconSize.Md,
  color = IconColor.inherit,
  className = '',
  style,
  ...props
}: IconProps) => (
  <Box
    className={classnames(className, 'mm-icon', `mm-icon--size-${size}`)}
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
    {...props}
  />
);
