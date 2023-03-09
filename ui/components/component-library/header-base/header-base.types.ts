import React from 'react';
import { BoxProps } from '../../ui/box';

export interface HeaderBaseProps extends BoxProps {
  children?: React.ReactNode;
  childrenWrapperProps?: BoxProps;
  startAccessory?: React.ReactNode;
  startAccessoryWrapperProps?: BoxProps;
  endAccessory?: React.ReactNode;
  endAccessoryWrapperProps?: BoxProps;
  className?: string;
}
