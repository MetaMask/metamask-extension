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
  severity = SEVERITIES.DANGER,
  ...props
}) => {
  const severityIcon = () => {
    switch (severity) {
      case SEVERITIES.DANGER:
        return (
          <Icon
            name={ICON_NAMES.DANGER_FILLED}
            size={SIZES.LG}
            color={COLORS.ERROR_DEFAULT}
          />
        );
      case SEVERITIES.WARNING:
        return (
          <Icon
            name={ICON_NAMES.DANGER_FILLED}
            size={SIZES.LG}
            color={COLORS.ERROR_DEFAULT}
          />
        );
      case SEVERITIES.SUCCESS:
        return (
          <Icon
            name={ICON_NAMES.DANGER_FILLED}
            size={SIZES.LG}
            color={COLORS.ERROR_DEFAULT}
          />
        );
      default:
        return (
          <Icon
            name={ICON_NAMES.INFO_FILLED}
            size={SIZES.LG}
            color={COLORS.PRIMARY_DEFAULT}
          />
        );
    }
  };
  return (
    <BannerBase
      startAccessory={severityIcon()}
      className={classnames('mm-banner', className)}
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
   * TODO WRITE HERE
   */
  severity: PropTypes.oneOf(Object.values(BANNER_SEVERITIES)),
  /**
   * Banner accepts all the props from BannerBase
   */
  ...BannerBase.propTypes,
};
