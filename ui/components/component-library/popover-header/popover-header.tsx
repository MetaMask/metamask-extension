import React from 'react';
import classnames from 'classnames';
import { HeaderBase, Text, ButtonIcon, ButtonIconSize, IconName } from '..';
import {
  IconColor,
  TextVariant,
  TextAlign,
  Color,
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
            ariaLabel={t('back')}
            size={ButtonIconSize.Sm}
            color={IconColor.inherit}
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
            ariaLabel={t('close')}
            size={ButtonIconSize.Sm}
            color={IconColor.inherit}
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
          color={Color.inherit}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </HeaderBase>
  );
};
