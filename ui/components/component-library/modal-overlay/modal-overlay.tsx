import React from 'react';
import classnames from 'clsx';

import {
  BackgroundColor,
  BlockSize,
} from '../../../helpers/constants/design-system';

import { Box, BoxProps } from '../box';
import type { PolymorphicRef } from '../box';

import {
  ModalOverlayProps,
  ModalOverlayComponent,
} from './modal-overlay.types';

/**
 * @deprecated This component is deprecated and will be removed in a future release.
 * Please use the ModalOverlay component from @metamask/design-system-react instead.
 * @see {@link https://github.com/MetaMask/metamask-design-system/blob/main/packages/design-system-react/MIGRATION.md#modaloverlay-component | Migration Guide}
 * @see {@link https://metamask.github.io/metamask-design-system/?path=/docs/react-components-modaloverlay--docs | Storybook Documentation}
 * @see {@link https://github.com/MetaMask/metamask-design-system/tree/main/packages/design-system-react/src/components/ModalOverlay | Component Source}
 */
export const ModalOverlay: ModalOverlayComponent = React.forwardRef(
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
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
