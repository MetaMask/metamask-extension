import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { BannerBase, Icon, IconName, IconSize } from '..';

import {
  BackgroundColor,
  IconColor,
  Severity,
} from '../../../helpers/constants/design-system';
import { BANNER_ALERT_SEVERITIES } from './banner-alert.constants';

export const BannerAlert = ({
  children,
  className,
  severity = Severity.Info,
  ...props
}) => {
  const severityIcon = () => {
    switch (severity) {
      case Severity.Danger:
        return {
          name: IconName.Danger,
          color: IconColor.errorDefault,
        };
      case Severity.Warning:
        return {
          name: IconName.Danger, // Uses same icon as danger
          color: IconColor.warningDefault,
        };
      case Severity.Success:
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
      case Severity.Danger:
        return BackgroundColor.errorMuted;
      case Severity.Warning:
        return BackgroundColor.warningMuted;
      case Severity.Success:
        return BackgroundColor.successMuted;
      // Defaults to Severity.Info
      default:
        return BackgroundColor.primaryMuted;
    }
  };

  return (
    <BannerBase
      startAccessory={<Icon size={IconSize.Lg} {...severityIcon()} />}
      backgroundColor={severityBackground()}
      paddingLeft={2}
      className={classnames(
        'mm-banner-alert',
        {
          [`mm-banner-alert--severity-${severity}`]: Object.values(
            BANNER_ALERT_SEVERITIES,
          ).includes(severity),
        },
        className,
      )}
      {...props}
    >
      {children}
    </BannerBase>
  );
};

BannerAlert.propTypes = {
  /**
   * An additional className to apply to the Banner
   */
  className: PropTypes.string,
  /**
   * Use the `severity` prop and the `Severity` enum from `./ui/helpers/constants/design-system.js` to change the context of `Banner`.
   * Possible options: `Severity.Info`(Default), `Severity.Warning`, `Severity.Danger`, `Severity.Success`
   */
  severity: PropTypes.oneOf(Object.values(BANNER_ALERT_SEVERITIES)),
  /**
   * BannerAlert accepts all the props from BannerBase
   */
  ...BannerBase.propTypes,
};
