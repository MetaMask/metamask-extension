import * as React from 'react';
import classnames from 'classnames';
import {
  Box,
  IconProps,
  IconSize,
  PolymorphicRef,
} from '../../../components/component-library';
import {
  BackgroundColor,
  Display,
} from '../../../helpers/constants/design-system';

const HollowCircle = React.forwardRef(
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  <C extends React.ElementType = 'span'>(
    { size = IconSize.Md, color, className = '', style }: IconProps<C>,
    ref?: PolymorphicRef<C>,
  ) => {
    return (
      <Box
        className={classnames(className, 'mm-icon', `mm-icon--size-${size}`)}
        ref={ref}
        as="span"
        display={Display.InlineBlock}
        style={{
          height: '12px',
          width: '12px',
          border: `1px solid var(--color-${color})`,
          borderRadius: '50%',
          backgroundColor: `var(--color-${BackgroundColor.backgroundDefault})`,
          zIndex: 1,
          ...style,
        }}
      />
    );
  },
);

export default HollowCircle;
