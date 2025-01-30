import React from 'react';
import type {
  StyleUtilityProps,
  PolymorphicComponentPropWithRef,
} from '../box';

// TODO: Convert to a `type` in a future major version.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface ModalOverlayStyleUtilityProps extends StyleUtilityProps {
  /**
   * onClick handler for the overlay
   * Not necessary when used with Modal and closeOnClickOutside is true
   */
  onClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  /**
   * Additional className to add to the ModalOverlay
   */
  className?: string;
}

export type ModalOverlayProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<C, ModalOverlayStyleUtilityProps>;

export type ModalOverlayComponent = <C extends React.ElementType = 'div'>(
  props: ModalOverlayProps<C>,
) => React.ReactElement | null;
