import React from 'react';
import classnames from 'clsx';

import { Box } from '../box';
import type { PolymorphicRef, BoxProps } from '../box';

import { ModalBodyProps, ModalBodyComponent } from './modal-body.types';

/**
 * @deprecated This component is deprecated and will be removed in a future release.
 * Please use the ModalBody component from @metamask/design-system-react instead.
 * @see {@link https://github.com/MetaMask/metamask-design-system/blob/main/packages/design-system-react/MIGRATION.md#modalbody-component | Migration Guide}
 * @see {@link https://metamask.github.io/metamask-design-system/?path=/docs/react-components-modalbody--docs | Storybook Documentation}
 * @see {@link https://github.com/MetaMask/metamask-design-system/tree/main/packages/design-system-react/src/components/ModalBody | Component Source}
 */
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
