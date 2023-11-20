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
  Sm = 'sm',
}

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
   * The size of ModalContent
   * Currently only one size is supported ModalContentSize.Sm 360px
   * See docs for more info
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
