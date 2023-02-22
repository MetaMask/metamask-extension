import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Box from '../../ui/box';
import { BannerBase } from '..';
import {
  AlignItems,
  BorderColor,
  DISPLAY,
} from '../../../helpers/constants/design-system';
import { BANNER_TIP_LOGOS } from './banner-tip.constants';

export const BannerTip = ({
  children,
  className,
  logoType = BANNER_TIP_LOGOS.GREETING,
  logoWrapperProps,
  logoProps,
  ...props
}) => {
  return (
    <BannerBase
      startAccessory={
        <Box
          display={DISPLAY.FLEX}
          alignItems={AlignItems.center}
          {...logoWrapperProps}
        >
          <Box
            as="img"
            className="mm-banner-tip--logo"
            src={`images/fox-${logoType}.png`}
            alt={`${logoType}`}
            {...logoProps}
          />
        </Box>
      }
      borderColor={BorderColor.borderDefault}
      className={classnames('mm-banner-tip', className)}
      {...props}
    >
      {children}
    </BannerBase>
  );
};

BannerTip.propTypes = {
  /**
   * An additional className to apply to the Banner
   */
  className: PropTypes.string,
  /**
   * Use the `logoType` prop with the `BANNER_TIP_LOGOS` object from `../../component-library` to change the logo image of `BannerTip`.
   * Possible options: `BANNER_TIP_LOGOS.INFO`(Default), `BANNER_TIP_LOGOS.EMPTY`,
   */
  logoType: PropTypes.oneOf(Object.values(BANNER_TIP_LOGOS)),
  /**
   * logoProps accepts all the props from Box
   */
  logoProps: PropTypes.shape(Box.propTypes),
  /**
   * logoWrapperProps accepts all the props from Box
   */
  logoWrapperProps: PropTypes.shape(Box.propTypes),
  /**
   * BannerTip accepts all the props from BannerBase
   */
  ...BannerBase.propTypes,
};
