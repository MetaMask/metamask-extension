import classnames from 'classnames';
// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import React from 'react';

import {
  BackgroundColor,
  BlockSize,
} from '../../../helpers/constants/design-system';
import { Box } from '../box';
import type { PolymorphicRef, BoxProps } from '../box';
import type {
  ModalOverlayProps,
  ModalOverlayComponent,
} from './modal-overlay.types';

export const ModalOverlay: ModalOverlayComponent = React.forwardRef(
  // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  <C extends React.ElementType = 'div'>(
    { onClick, className = '', ...props }: ModalOverlayProps<C>,
    ref?: PolymorphicRef<C>,
  ) => (
    <Box
      className={classnames('mm-modal-overlay', className)}
      ref={ref}
      backgroundColor={BackgroundColor.overlayDefault}
      width={BlockSize.Full}
      height={BlockSize.Full}
      onClick={onClick}
      aria-hidden="true"
      {...(props as BoxProps<C>)}
    />
  ),
);

export default ModalOverlay;
