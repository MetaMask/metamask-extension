import * as React from 'react';
import classnames from 'clsx';
import { Box } from '@metamask/design-system-react';
import {
  IconProps,
  IconSize,
  PolymorphicRef,
} from '../../../components/component-library';
import { BackgroundColor } from '../../../helpers/constants/design-system';

const HollowCircle = React.forwardRef(
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  <C extends React.ElementType = 'span'>(
    { size = IconSize.Md, color, className = '', style }: IconProps<C>,
    ref?: PolymorphicRef<C>,
  ) => {
    return (
      <Box
        asChild
        className={classnames(
          className,
          'mm-icon',
          `mm-icon--size-${size}`,
          'inline-block',
        )}
        style={{
          height: '12px',
          width: '12px',
          border: `1px solid var(--color-${color})`,
          borderRadius: '50%',
          backgroundColor: `var(--color-${BackgroundColor.backgroundDefault})`,
          zIndex: 1,
          ...style,
        }}
      >
        <span ref={ref} />
      </Box>
    );
  },
);

export default HollowCircle;
