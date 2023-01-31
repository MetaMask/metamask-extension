import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { BannerBase, Icon, ICON_NAMES } from '..';

import {
  COLORS,
  SEVERITIES,
  SIZES,
} from '../../../helpers/constants/design-system';
import { BANNER_SEVERITIES } from './banner.constants';

export const Banner = ({
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
          color: COLORS.ERROR_DEFAULT,
        };
      case SEVERITIES.WARNING:
        return {
          name: ICON_NAMES.WARNING,
          color: COLORS.WARNING_DEFAULT,
        };
      case SEVERITIES.SUCCESS:
        return {
          name: ICON_NAMES.CONFIRMATION,
          color: COLORS.SUCCESS_DEFAULT,
        };
      // Defaults to SEVERITIES.INFO
      default:
        return {
          name: ICON_NAMES.INFO,
          color: COLORS.PRIMARY_DEFAULT,
        };
    }
  };

  const severityBackground = () => {
    switch (severity) {
      case SEVERITIES.DANGER:
        return COLORS.ERROR_MUTED;
      case SEVERITIES.WARNING:
        return COLORS.WARNING_MUTED;
      case SEVERITIES.SUCCESS:
        return COLORS.SUCCESS_MUTED;
      // Defaults to SEVERITIES.INFO
      default:
        return COLORS.PRIMARY_MUTED;
    }
  };

  return (
    <BannerBase
      startAccessory={<Icon size={SIZES.LG} {...severityIcon()} />}
      backgroundColor={severityBackground()}
      className={classnames(
        'mm-banner',
        {
          [`mm-banner--severity-${severity}`]:
            Object.values(BANNER_SEVERITIES).includes(severity),
        },
        className,
      )}
      {...props}
    >
      {children}
    </BannerBase>
  );
};

Banner.propTypes = {
  /**
   * An additional className to apply to the Banner
   */
  className: PropTypes.string,
  /**
   * Use the `severity` prop and the `SEVERITIES` object from `./ui/helpers/constants/design-system.js` to change the context of `Banner`.
   * Possible options: `SEVERITIES.INFO`(Default), `SEVERITIES.WARNING`, `SEVERITIES.DANGER`, `SEVERITIES.SUCCESS`
   */
  severity: PropTypes.oneOf(Object.values(BANNER_SEVERITIES)),
  /**
   * Banner accepts all the props from BannerBase
   */
  ...BannerBase.propTypes,
};
