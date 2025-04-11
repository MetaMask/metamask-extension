import classnames from 'classnames';
import React from 'react';

import {
  IconColor,
  TextVariant,
  TextAlign,
  TextColor,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { ButtonIcon, ButtonIconSize } from '../button-icon';
import { HeaderBase } from '../header-base';
import { IconName } from '../icon';
import { Text } from '../text';
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
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31880
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
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31880
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
