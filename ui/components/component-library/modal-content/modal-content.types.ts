import React from 'react';
import type {
  PolymorphicComponentPropWithRef,
  StyleUtilityProps,
} from '../box';

/*
 * ModalContent sizes
 * Currently there is only use case for one size of ModalContent in the extension
 * See audit https://www.figma.com/file/hxYqloYgmVcgsoiVqmGZ8K/Modal-Audit?node-id=481%3A244&t=XITeuRB1pRc09hiG-1
 * Not to say there won't be more in the future, but to prevent redundant code there is only one for now
 */
export enum ModalContentSize {
  // 360px
  Sm = 'sm',
  // 480px
  Md = 'md',
  // 720px
  Lg = 'lg',
}

// TODO: Convert to a `type` in a future major version.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface ModalContentStyleUtilityProps extends StyleUtilityProps {
  /**
   * The additional className of the ModalContent component
   */
  className?: string;
  /**
   * The content of the ModalContent component
   */
  children: React.ReactNode;
  /**
   * Use the size prop and ModalContentSize enum to change the max-width of the ModalContent
   *
   * ModalContentSize.Sm = 360px
   * ModalContentSize.Md = 480px
   * ModalContentSize.Lg = 720px
   *
   * @default ModalContentSize.Sm
   */
  size?: ModalContentSize;
  /**
   * Additional props to pass to the dialog node inside of ModalContent component
   */
  modalDialogProps?: any;
}

export type ModalContentProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<C, ModalContentStyleUtilityProps>;

export type ModalContentComponent = <C extends React.ElementType = 'div'>(
  props: ModalContentProps<C>,
) => React.ReactElement | null;
