import React from 'react';
import type { BoxProps } from '../../ui/box/box.d';
import { Size } from '../../../helpers/constants/design-system';

export enum ModalContentSize {
  Sm = Size.SM,
  Md = Size.MD,
  Lg = Size.LG,
}

export interface ModalContentProps extends BoxProps {
  modalContentRef?: React.RefObject<HTMLElement>;
  className?: string;
  children?: React.ReactNode;
  size?: ModalContentSize;
}
