import React from 'react';
import classnames from 'classnames';
import { HeaderBase, ButtonIcon, ButtonIconSize, IconName, Text } from '..';
import {
  IconColor,
  TextVariant,
  TextAlign,
  TextColor,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { PopoverHeaderProps } from '.';

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
