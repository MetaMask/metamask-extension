import React from 'react';
import type { BannerBaseStyleUtilityProps } from '../banner-base/banner-base.types';
import type { PolymorphicComponentPropWithRef } from '../box';

export enum BannerAlertSeverity {
  Danger = 'danger',
  Info = 'info',
  Success = 'success',
  Warning = 'warning',
}

export interface BannerAlertStyleUtilityProps
  extends BannerBaseStyleUtilityProps {
  /**
   * An additional className to apply to the Banner
   */
  className?: string;
  /**
   * Use the BannerAlertSeverity enum to change the context of `Banner`.
   * Possible options: `BannerAlertSeverity.Info`(Default), `BannerAlertSeverity.Warning`, `BannerAlertSeverity.Danger`, `BannerAlertSeverity.Success`
   */
  severity?: BannerAlertSeverity;
}

export type BannerAlertProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<C, BannerAlertStyleUtilityProps>;

export type BannerAlertComponent = <C extends React.ElementType = 'div'>(
  props: BannerAlertProps<C>,
) => React.ReactElement | null;
