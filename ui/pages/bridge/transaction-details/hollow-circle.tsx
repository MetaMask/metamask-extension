import * as React from 'react';
import classnames from 'classnames';
import {
  Box,
  BoxProps,
  IconProps,
  IconSize,
  PolymorphicRef,
} from '../../../components/component-library';
import {
  BackgroundColor,
  Display,
  IconColor,
} from '../../../helpers/constants/design-system';

const HollowCircle = React.forwardRef(
  <C extends React.ElementType = 'span'>(
    {
      size = IconSize.Md,
      color,
      className = '',
      style,
      ...props
    }: IconProps<C>,
    ref?: PolymorphicRef<C>,
  ) => {
    return (
      <Box>
        <Box
          className={classnames(className, 'mm-icon', `mm-icon--size-${size}`)}
          ref={ref}
          as="span"
          display={Display.InlineBlock}
          color={BackgroundColor.backgroundDefault}
          style={{
            height: '12px',
            width: '12px',
            border: `1px solid var(--color-${color})`,
            borderRadius: '50%',
            ...style,
          }}
        />
      </Box>
    );
  },
);

export default HollowCircle;
