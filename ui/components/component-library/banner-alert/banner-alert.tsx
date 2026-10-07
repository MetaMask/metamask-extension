import React from 'react';
import classnames from 'clsx';

import {
  BackgroundColor,
  IconColor,
} from '../../../helpers/constants/design-system';
import { PolymorphicRef } from '../box/box.types';
import { BannerBase } from '../banner-base/banner-base';
import { BannerBaseProps } from '../banner-base/banner-base.types';
import { Icon } from '../icon/icon';
import { IconName, IconSize } from '../icon/icon.types';
import {
  BannerAlertComponent,
  BannerAlertProps,
  BannerAlertSeverity,
} from './banner-alert.types';

/**
 * @deprecated This component is deprecated and will be removed in a future release.
 * Please use the BannerAlert component from @metamask/design-system-react instead.
 * @see {@link https://github.com/MetaMask/metamask-design-system/blob/main/packages/design-system-react/MIGRATION.md#banneralert-component | Migration Guide}
 */
export const BannerAlert: BannerAlertComponent = React.forwardRef(
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
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
