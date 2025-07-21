import React from 'react';
import classnames from 'classnames';
import { Text } from '../text';
import type { TextProps } from '../text';
import {
  FontWeight,
  TextVariant,
  Display,
  AlignItems,
} from '../../../helpers/constants/design-system';
import type { PolymorphicRef } from '../box';
import { LabelProps, LabelComponent } from './label.types';

export const Label: LabelComponent = React.forwardRef(
  <C extends React.ElementType = 'label'>(
    { htmlFor, className, children, ...props }: LabelProps<C>,
    ref?: PolymorphicRef<C>,
  ) => {
    return (
      <Text
        className={classnames(
          'mm-label',
          { 'mm-label--html-for': Boolean(htmlFor) },
          className ?? '',
        )}
        as="label"
        htmlFor={htmlFor}
        variant={TextVariant.bodyMd}
        fontWeight={FontWeight.Medium}
        display={Display.InlineFlex}
        alignItems={AlignItems.center}
        ref={ref}
        {...(props as TextProps<C>)}
      >
        {children}
      </Text>
    );
  },
);
