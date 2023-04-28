import React, { useContext } from 'react';
import classnames from 'classnames';
import {
  TextVariant,
  TextAlign,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';

import { HeaderBase, Text, ButtonIcon, ButtonIconSize, IconName } from '..';

import { ModalContext } from '../modal';

import { ModalHeaderProps } from '.';

export const ModalHeader: React.FC<ModalHeaderProps> = ({
  children,
  className = '',
  startAccessory,
  endAccessory,
  onClose: onCloseProp,
  closeButtonProps,
  onBack,
  backButtonProps,
  ...props
}) => {
  const t = useI18nContext();
  const { onClose } = useContext(ModalContext);
  return (
    <HeaderBase
      className={classnames('mm-modal-header', className)}
      startAccessory={
        startAccessory ||
        (onBack && (
          <ButtonIcon
            iconName={IconName.ArrowLeft}
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
            ariaLabel={t('close')}
            size={ButtonIconSize.Sm}
            onClick={onClose || onCloseProp}
            {...closeButtonProps}
          />
        ))
      }
      {...props}
    >
      {typeof children === 'string' ? (
        <Text variant={TextVariant.headingSm} textAlign={TextAlign.Center}>
          {children}
        </Text>
      ) : (
        children
      )}
    </HeaderBase>
  );
};
