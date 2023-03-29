import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { BannerBase, Icon, ICON_NAMES } from '..';

import {
  BackgroundColor,
  IconColor,
  SEVERITIES,
  Size,
} from '../../../helpers/constants/design-system';
import { BANNER_ALERT_SEVERITIES } from './banner-alert.constants';

export const BannerAlert = ({
  children,
  className,
  severity = SEVERITIES.INFO,
  ...props
}) => {
  const severityIcon = () => {
    switch (severity) {
      case SEVERITIES.DANGER:
        return {
          name: ICON_NAMES.DANGER,
          color: IconColor.errorDefault,
        };
      case SEVERITIES.WARNING:
        return {
          name: ICON_NAMES.WARNING,
          color: IconColor.warningDefault,
        };
      case SEVERITIES.SUCCESS:
        return {
          name: ICON_NAMES.CONFIRMATION,
          color: IconColor.successDefault,
        };
      // Defaults to SEVERITIES.INFO
      default:
        return {
          name: ICON_NAMES.INFO,
          color: IconColor.primaryDefault,
        };
    }
  };

  const severityBackground = () => {
    switch (severity) {
      case SEVERITIES.DANGER:
        return BackgroundColor.errorMuted;
      case SEVERITIES.WARNING:
        return BackgroundColor.warningMuted;
      case SEVERITIES.SUCCESS:
        return BackgroundColor.successMuted;
      // Defaults to SEVERITIES.INFO
      default:
        return BackgroundColor.primaryMuted;
    }
  };

  return (
    <BannerBase
      startAccessory={<Icon size={Size.LG} {...severityIcon()} />}
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
   * Use the `severity` prop and the `SEVERITIES` object from `./ui/helpers/constants/design-system.js` to change the context of `Banner`.
   * Possible options: `SEVERITIES.INFO`(Default), `SEVERITIES.WARNING`, `SEVERITIES.DANGER`, `SEVERITIES.SUCCESS`
   */
  severity: PropTypes.oneOf(Object.values(BANNER_ALERT_SEVERITIES)),
  /**
   * BannerAlert accepts all the props from BannerBase
   */
  ...BannerBase.propTypes,
};
