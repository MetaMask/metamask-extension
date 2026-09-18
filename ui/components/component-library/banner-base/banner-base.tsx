import React from 'react';
import classnames from 'clsx';
import { useI18nContext } from '../../../hooks/useI18nContext';

import {
  BackgroundColor,
  BlockSize,
  BorderRadius,
  Display,
  TextVariant,
} from '../../../helpers/constants/design-system';

import { Text } from '../text';
import { Box, BoxProps, PolymorphicRef } from '../box';
import { ButtonLink, ButtonLinkSize } from '../button-link';
import { ButtonIcon, ButtonIconSize } from '../button-icon';
import { IconName } from '../icon';
import { BannerBaseComponent, BannerBaseProps } from './banner-base.types';

/**
 * @deprecated This component is deprecated and will be removed in a future release.
 * Please use the BannerBase component from @metamask/design-system-react instead.
 * @see {@link https://github.com/MetaMask/metamask-design-system/blob/main/packages/design-system-react/MIGRATION.md#bannerbase-component | Migration Guide}
 * @see {@link https://metamask.github.io/metamask-design-system/?path=/docs/react-components-bannerbase--docs | Storybook Documentation}
 * @see {@link https://github.com/MetaMask/metamask-design-system/tree/main/packages/design-system-react/src/components/BannerBase | Component Source}
 */
export const BannerBase: BannerBaseComponent = React.forwardRef(
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  <C extends React.ElementType = 'div'>(
    {
      className = '',
      title,
      titleProps,
      description,
      descriptionProps,
      children,
      childrenWrapperProps,
      actionButtonLabel,
      actionButtonOnClick,
      actionButtonProps,
      startAccessory,
      onClose,
      closeButtonProps,
      ...props
    }: BannerBaseProps<C>,
    ref?: PolymorphicRef<C>,
  ) => {
    const t = useI18nContext();
    return (
      <Box
        className={classnames('mm-banner-base', className)}
        ref={ref}
        display={Display.Flex}
        gap={2}
        backgroundColor={BackgroundColor.backgroundDefault}
        borderRadius={BorderRadius.SM}
        padding={3}
        {...(props as BoxProps<C>)}
      >
        {startAccessory && <>{startAccessory}</>}

        {/* min-Width: 0 style is used to prevent grid/flex blowout */}
        <Box minWidth={BlockSize.Zero}>
          {title && (
            <Text variant={TextVariant.bodyMdMedium} {...titleProps}>
              {title}
            </Text>
          )}
          {description && (
            <Text variant={TextVariant.bodySm} {...descriptionProps}>
              {description}
            </Text>
          )}
          {children && typeof children === 'object' ? (
            children
          ) : (
            <Text {...childrenWrapperProps}>{children}</Text>
          )}
          {actionButtonLabel && (
            <ButtonLink
              size={ButtonLinkSize.Auto}
              onClick={actionButtonOnClick}
              {...actionButtonProps}
            >
              {actionButtonLabel}
            </ButtonLink>
          )}
        </Box>

        {onClose && (
          <ButtonIcon
            className="mm-banner-base__close-button"
            marginLeft="auto"
            iconName={IconName.Close}
            size={ButtonIconSize.Sm}
            ariaLabel={t('close')}
            onClick={onClose}
            {...closeButtonProps}
          />
        )}
      </Box>
    );
  },
);
