import React from 'react';
import classnames from 'classnames';

import { Box } from '../box';
import type { PolymorphicRef, BoxProps } from '../box';

import { ModalBodyProps, ModalBodyComponent } from './modal-body.types';

export const ModalBody: ModalBodyComponent = React.forwardRef(
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  <C extends React.ElementType = 'div'>(
    { className = '', children, ...props }: ModalBodyProps<C>,
    ref?: PolymorphicRef<C>,
  ) => (
    <Box
      className={classnames('mm-modal-body', className)}
      ref={ref}
      paddingLeft={4}
      paddingRight={4}
      {...(props as BoxProps<C>)}
    >
      {children}
    </Box>
  ),
);

export default ModalBody;
