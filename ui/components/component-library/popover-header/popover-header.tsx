import React, { forwardRef } from 'react';
import classnames from 'classnames';
import { HeaderBase, Text, ButtonIcon, BUTTON_ICON_SIZES, IconName } from '..';
import {
  TextVariant,
  TEXT_ALIGN,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { PopoverHeaderProps } from '.';

export const PopoverHeader = forwardRef<PopoverHeaderProps>(
  ({
    children,
    className = '',
    startAccessory,
    endAccessory,
    onClose,
    closeButtonProps,
    onBack,
    backButtonProps,
    ...props
  }: PopoverHeaderProps) => {
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
              size={BUTTON_ICON_SIZES.SM}
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
              size={BUTTON_ICON_SIZES.SM}
              onClick={onClose}
              {...closeButtonProps}
            />
          ))
        }
        {...props}
      >
        {typeof children === 'string' ? (
          <Text variant={TextVariant.headingSm} textAlign={TEXT_ALIGN.CENTER}>
            {children}
          </Text>
        ) : (
          children
        )}
      </HeaderBase>
    );
  },
);
