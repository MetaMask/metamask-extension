import React from 'react';
import classnames from 'classnames';
import type { PolymorphicRef, BoxProps } from '../box';
import { Box } from '../box';

import { ContainerProps, ContainerComponent } from './container.types';

export const Container: ContainerComponent = React.forwardRef(
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  <C extends React.ElementType = 'div'>(
    { children, className = '', maxWidth, ...props }: ContainerProps<C>,
    ref?: PolymorphicRef<C>,
  ) => {
    return (
      <Box
        className={classnames(
          'mm-container',
          `mm-container--max-width-${maxWidth}`,
          className,
        )}
        ref={ref}
        {...(props as BoxProps<C>)}
      >
        {children}
      </Box>
    );
  },
);
