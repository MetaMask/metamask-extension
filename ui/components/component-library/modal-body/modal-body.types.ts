import React from 'react';

import type {
  StyleUtilityProps,
  PolymorphicComponentPropWithRef,
} from '../box';

// TODO: Convert to a `type` in a future major version.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface ModalBodyStyleUtilityProps extends StyleUtilityProps {
  /**
   * Additional className to add to the ModalBody
   */
  className?: string;
  /**
   * The content of the ModalBody
   */
  children?: React.ReactNode;
}

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export type ModalBodyProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<C, ModalBodyStyleUtilityProps>;

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export type ModalBodyComponent = <C extends React.ElementType = 'span'>(
  props: ModalBodyProps<C>,
) => React.ReactElement | null;
