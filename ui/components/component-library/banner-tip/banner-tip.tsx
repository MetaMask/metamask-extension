import React from 'react';
import classnames from 'classnames';
import {
  AlignItems,
  BorderColor,
  Display,
} from '../../../helpers/constants/design-system';
import { Box, BoxProps, PolymorphicRef } from '../box';
import { BannerBase, BannerBaseProps } from '../banner-base';
import {
  BannerTipComponent,
  // BannerTipLogoType,
  BannerTipProps,
} from './banner-tip.types';

export const BannerTip: BannerTipComponent = React.forwardRef(
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  <C extends React.ElementType = 'div'>(
    {
      children,
      className = '',
      // TODO: Get new assets for greeting and chat based off
      // of the new branding. If decision is to use the normal fox
      // then remove enum and update stories to use the normal fox
      // logoType = BannerTipLogoType.Greeting,
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
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        startAccessory || (
          <Box
            display={Display.Flex}
            alignItems={AlignItems.center}
            {...logoWrapperProps}
          >
            <Box
              as="img"
              src={`images/fox.png`}
              alt="Fox"
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
