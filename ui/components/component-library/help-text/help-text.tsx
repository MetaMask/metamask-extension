import React, { forwardRef } from 'react';
import classnames from 'classnames';
import {
  TextVariant,
  TextColor,
} from '../../../helpers/constants/design-system';
import { Text } from '../text';
import type { PolymorphicRef } from '../box';
import type { TextProps } from '../text';
import type { HelpTextProps, HelpTextComponent } from './help-text.types';
import { HelpTextSeverity } from '.';

export const HelpText: HelpTextComponent = forwardRef(
  <C extends React.ElementType = 'p'>(
    {
      severity,
      color = TextColor.textDefault,
      className,
      children,
      ...props
    }: HelpTextProps<C>,
    ref?: PolymorphicRef<C>,
  ) => {
    const severityColor = () => {
      switch (severity) {
        case HelpTextSeverity.Danger:
          return TextColor.errorDefault;
        case HelpTextSeverity.Warning:
          return TextColor.warningDefault;
        case HelpTextSeverity.Success:
          return TextColor.successDefault;
        case HelpTextSeverity.Info:
          return TextColor.infoDefault;
        // Defaults to HelpTextSeverity.Info
        default:
          return TextColor.textDefault;
      }
    };

    return (
      <Text
        className={classnames('mm-help-text', className ?? '')}
        ref={ref}
        as={children && typeof children === 'object' ? 'div' : 'p'}
        variant={TextVariant.bodyXs}
        color={severity ? severityColor() : color}
        {...(props as TextProps<C>)}
      >
        {children}
      </Text>
    );
  },
);
