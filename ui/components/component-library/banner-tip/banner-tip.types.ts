import React from 'react';
import type { BannerBaseStyleUtilityProps } from '../banner-base/banner-base.types';
import type { PolymorphicComponentPropWithRef, BoxProps } from '../box';

export enum BannerTipLogoType {
  Greeting = 'greeting',
  Chat = 'chat',
}

// TODO: Convert to a `type` in a future major version.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface BannerTipStyleUtilityProps
  extends BannerBaseStyleUtilityProps {
  /**
   * An additional className to apply to the Banner
   */
  className?: string;
  /**
   * Use the `logoType` prop with the `BannerTipLogoType` enum from `../../component-library` to change the logo image of `BannerTip`.
   * Possible options: `BannerTipLogoType.Greeting`(Default), `BannerTipLogoType.Chat`,
   */
  logoType?: BannerTipLogoType;
  /**
   * logoProps accepts all the props from Box
   */
  logoProps?: BoxProps<'span'>;
  /**
   * logoWrapperProps accepts all the props from Box
   */
  logoWrapperProps?: BoxProps<'span'>;
  /**
   * The start(default left) content area of BannerBase
   */
  startAccessory?: React.ReactNode;
}

export type BannerTipProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<C, BannerTipStyleUtilityProps>;

export type BannerTipComponent = <C extends React.ElementType = 'div'>(
  props: BannerTipProps<C>,
) => React.ReactElement | null;
