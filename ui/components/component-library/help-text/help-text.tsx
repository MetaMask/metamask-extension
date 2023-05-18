import React, { Ref, forwardRef } from 'react';
import classnames from 'classnames';
import {
  TextVariant,
  TextColor,
} from '../../../helpers/constants/design-system';
import { Text, ValidTag } from '../text';
import { HelpTextProps, HelpTextSeverity } from './help-text.types';

export const HelpText = forwardRef(
  (
    {
      severity,
      color = TextColor.textDefault,
      className,
      children,
      ...props
    }: HelpTextProps,
    ref: Ref<HTMLElement>,
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
        as={
          children && typeof children === 'object' ? ValidTag.Div : ValidTag.P
        }
        variant={TextVariant.bodyXs}
        color={severity ? severityColor() : color}
        {...props}
      >
        {children}
      </Text>
    );
  },
);
