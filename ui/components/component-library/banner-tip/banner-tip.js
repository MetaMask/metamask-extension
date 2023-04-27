import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {
  AlignItems,
  BorderColor,
  DISPLAY,
} from '../../../helpers/constants/design-system';
import Box from '../../ui/box';
import { BannerBase } from '..';
import { BannerTipLogoType } from './banner-tip.constants';

export const BannerTip = ({
  children,
  className,
  logoType = BannerTipLogoType.Greeting,
  logoWrapperProps,
  logoProps,
  startAccessory,
  ...props
}) => {
  return (
    <BannerBase
      startAccessory={
        startAccessory || (
          <Box
            display={DISPLAY.FLEX}
            alignItems={AlignItems.center}
            {...logoWrapperProps}
          >
            <Box
              as="img"
              className="mm-banner-tip--logo"
              src={`images/fox-${logoType}.png`}
              alt={logoType}
              {...logoProps}
            />
          </Box>
        )
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
   * Use the `logoType` prop with the `BannerTipLogoType` enum from `../../component-library` to change the logo image of `BannerTip`.
   * Possible options: `BannerTipLogoType.Greeting`(Default), `BannerTipLogoType.Chat`,
   */
  logoType: PropTypes.oneOf(Object.values(BannerTipLogoType)),
  /**
   * logoProps accepts all the props from Box
   */
  logoProps: PropTypes.shape(Box.propTypes),
  /**
   * logoWrapperProps accepts all the props from Box
   */
  logoWrapperProps: PropTypes.shape(Box.propTypes),
  /**
   * The start(defualt left) content area of BannerBase
   */
  startAccessory: PropTypes.node,
  /**
   * BannerTip accepts all the props from BannerBase
   */
  ...BannerBase.propTypes,
};
