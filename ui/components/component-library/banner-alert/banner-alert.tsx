import React from 'react';
import classnames from 'classnames';

import { BannerBase, Icon, IconName, IconSize } from '..';

import {
  BackgroundColor,
  IconColor,
} from '../../../helpers/constants/design-system';
import { PolymorphicRef } from '../box';
import { BannerBaseProps } from '../banner-base';
import {
  BannerAlertComponent,
  BannerAlertProps,
  BannerAlertSeverity,
} from './banner-alert.types';

export const BannerAlert: BannerAlertComponent = React.forwardRef(
  <C extends React.ElementType = 'div'>(
    {
      children,
      className = '',
      severity = BannerAlertSeverity.Info,
      ...props
    }: BannerAlertProps<C>,
    ref?: PolymorphicRef<C>,
  ) => {
    const severityIcon = () => {
      switch (severity) {
        case BannerAlertSeverity.Danger:
          return {
            name: IconName.Danger,
            color: IconColor.errorDefault,
          };
        case BannerAlertSeverity.Warning:
          return {
            name: IconName.Danger, // Uses same icon as danger
            color: IconColor.warningDefault,
          };
        case BannerAlertSeverity.Success:
          return {
            name: IconName.Confirmation,
            color: IconColor.successDefault,
          };
        // Defaults to Severity.Info
        default:
          return {
            name: IconName.Info,
            color: IconColor.primaryDefault,
          };
      }
    };

    const severityBackground = () => {
      switch (severity) {
        case BannerAlertSeverity.Danger:
          return BackgroundColor.errorMuted;
        case BannerAlertSeverity.Warning:
          return BackgroundColor.warningMuted;
        case BannerAlertSeverity.Success:
          return BackgroundColor.successMuted;
        // Defaults to Severity.Info
        default:
          return BackgroundColor.primaryMuted;
      }
    };

    return (
      <BannerBase
        ref={ref}
        startAccessory={<Icon size={IconSize.Lg} {...severityIcon()} />}
        backgroundColor={severityBackground()}
        paddingLeft={2}
        className={classnames(
          'mm-banner-alert',
          {
            [`mm-banner-alert--severity-${severity}`]:
              Object.values(BannerAlertSeverity).includes(severity),
          },
          className,
        )}
        {...(props as BannerBaseProps<C>)}
      >
        {children}
      </BannerBase>
    );
  },
);
