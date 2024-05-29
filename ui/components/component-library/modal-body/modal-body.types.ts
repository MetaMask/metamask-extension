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

export type ModalBodyProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<C, ModalBodyStyleUtilityProps>;

export type ModalBodyComponent = <C extends React.ElementType = 'span'>(
  props: ModalBodyProps<C>,
) => React.ReactElement | null;
