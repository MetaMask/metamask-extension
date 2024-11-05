import * as React from 'react';
import classnames from 'classnames';
import {
  Box,
  BoxProps,
  IconProps,
  IconSize,
  PolymorphicRef,
} from '../../../components/component-library';
import { Display, IconColor } from '../../../helpers/constants/design-system';

const HollowCircle = React.forwardRef(
  <C extends React.ElementType = 'span'>(
    {
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
        maskImage: `url('./images/hollow-circle.svg')`,
        WebkitMaskImage: `url('./images/hollow-circle.svg')`,
        ...style,
      }}
      {...(props as BoxProps<C>)}
    />
  ),
);

export default HollowCircle;
