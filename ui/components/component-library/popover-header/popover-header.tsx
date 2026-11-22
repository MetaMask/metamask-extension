import React from 'react';
import classnames from 'clsx';
import { Text } from '../text';
import {
  IconColor,
  TextVariant,
  TextAlign,
  TextColor,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { HeaderBase } from '../header-base';
import { ButtonIcon, ButtonIconSize } from '../button-icon';
import { IconName } from '../icon';
import type { PopoverHeaderProps } from './popover-header.types';

/**
 * @param options0
 * @param options0.children
 * @param options0.className
 * @param options0.startAccessory
 * @param options0.endAccessory
 * @param options0.onClose
 * @param options0.closeButtonProps
 * @param options0.onBack
 * @param options0.backButtonProps
 * @deprecated This component is deprecated and will be removed in a future release.
 * Please use the PopoverHeader component from @metamask/design-system-react instead.
 * @see {@link https://github.com/MetaMask/metamask-design-system/blob/main/packages/design-system-react/MIGRATION.md#popoverheader-component | Migration Guide}
 * @see {@link https://metamask.github.io/metamask-design-system/?path=/docs/react-components-popoverheader--docs | Storybook Documentation}
 * @see {@link https://github.com/MetaMask/metamask-design-system/tree/main/packages/design-system-react/src/components/PopoverHeader | Component Source}
 */
export const PopoverHeader = ({
  children,
  className = '',
  startAccessory,
  endAccessory,
  onClose,
  closeButtonProps,
  onBack,
  backButtonProps,
  ...props
}: React.PropsWithChildren<PopoverHeaderProps>) => {
  const t = useI18nContext();
  return (
    <HeaderBase
      className={classnames('mm-popover-header', className)}
      startAccessory={
        startAccessory ||
        (onBack && (
          <ButtonIcon
            iconName={IconName.ArrowLeft}
            color={IconColor.inherit}
            ariaLabel={t('back')}
            size={ButtonIconSize.Sm}
            onClick={onBack}
            {...backButtonProps}
          />
        ))
      }
      endAccessory={
        endAccessory ||
        (onClose && (
          <ButtonIcon
            iconName={IconName.Close}
            color={IconColor.inherit}
            ariaLabel={t('close')}
            size={ButtonIconSize.Sm}
            onClick={onClose}
            {...closeButtonProps}
          />
        ))
      }
      {...props}
    >
      {typeof children === 'string' ? (
        <Text
          variant={TextVariant.headingSm}
          textAlign={TextAlign.Center}
          color={TextColor.inherit}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </HeaderBase>
  );
};
