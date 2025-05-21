import React from 'react';
import classnames from 'classnames';
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

export const PopoverHeader: React.FC<PopoverHeaderProps> = ({
  children,
  className = '',
  startAccessory,
  endAccessory,
  onClose,
  closeButtonProps,
  onBack,
  backButtonProps,
  ...props
}) => {
  const t = useI18nContext();
  return (
    <HeaderBase
      className={classnames('mm-popover-header', className)}
      startAccessory={
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
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
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
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
