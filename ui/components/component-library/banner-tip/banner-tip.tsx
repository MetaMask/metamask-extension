import React from 'react';
import classnames from 'classnames';
import {
  AlignItems,
  BorderColor,
  Display,
} from '../../../helpers/constants/design-system';
import { BannerBase, Box } from '..';
import { BoxProps, PolymorphicRef } from '../box';
import { BannerBaseProps } from '../banner-base';
import {
  BannerTipComponent,
  BannerTipLogoType,
  BannerTipProps,
} from './banner-tip.types';

export const BannerTip: BannerTipComponent = React.forwardRef(
  <C extends React.ElementType = 'div'>(
    {
      children,
      className = '',
      logoType = BannerTipLogoType.Greeting,
      logoWrapperProps,
      logoProps,
      startAccessory,
      ...props
    }: BannerTipProps<C>,
    ref?: PolymorphicRef<C>,
  ) => (
    <BannerBase
      ref={ref}
      startAccessory={
        startAccessory || (
          <Box
            display={Display.Flex}
            alignItems={AlignItems.center}
            {...logoWrapperProps}
          >
            <Box
              as="img"
              src={`images/fox-${logoType}.png`}
              alt={logoType}
              {...(logoProps as BoxProps<C>)}
              className={classnames(
                'mm-banner-tip--logo',
                logoProps?.className ?? '',
              )}
            />
          </Box>
        )
      }
      borderColor={BorderColor.borderDefault}
      className={classnames('mm-banner-tip', className)}
      {...(props as BannerBaseProps<C>)}
    >
      {children}
    </BannerBase>
  ),
);
