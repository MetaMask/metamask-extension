import React from 'react';
import { BoxProps } from '../../ui/box';

export interface HeaderBaseProps extends BoxProps {
  /**
   * The children is the title area of the HeaderBase
   */
  children?: React.ReactNode;
  /**
   * Use the `childrenWrapperProps` prop to define the props to the children wrapper
   */
  childrenWrapperProps?: BoxProps;
  /**
   * The start(defualt left) content area of HeaderBase
   */
  startAccessory?: React.ReactNode;
  /**
   * Use the `startAccessoryWrapperProps` prop to define the props to the start accessory wrapper
   */
  startAccessoryWrapperProps?: BoxProps;
  /**
   * The end (defualt right) content area of HeaderBase
   */
  endAccessory?: React.ReactNode;
  /**
   * Use the `endAccessoryWrapperProps` prop to define the props to the end accessory wrapper
   */
  endAccessoryWrapperProps?: BoxProps;
  /**
   * An additional className to apply to the HeaderBase
   */
  className?: string;
}
