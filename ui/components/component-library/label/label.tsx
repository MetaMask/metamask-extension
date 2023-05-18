import React, { Ref, forwardRef } from 'react';
import classnames from 'classnames';
import { Text, ValidTag } from '../text';
import {
  FontWeight,
  TextVariant,
  Display,
  AlignItems,
} from '../../../helpers/constants/design-system';
import { LabelProps } from './label.types';

export const Label = forwardRef(function Label(
  { htmlFor, className, children, ...props }: LabelProps,
  ref: Ref<HTMLElement>,
) {
  return (
    <Text
      className={classnames(
        'mm-label',
        { 'mm-label--html-for': Boolean(htmlFor) },
        className ?? '',
      )}
      as={ValidTag.Label}
      htmlFor={htmlFor}
      variant={TextVariant.bodyMd}
      fontWeight={FontWeight.Bold}
      display={Display.InlineFlex}
      alignItems={AlignItems.center}
      ref={ref}
      {...props}
    >
      {children}
    </Text>
  );
});
