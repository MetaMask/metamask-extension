import React from 'react';
import classnames from 'classnames';
import { HeaderBase, Text, ButtonIcon, ButtonIconSize, IconName } from '..';
import {
  TextVariant,
  TextAlign,
  BlockSize,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { ModalHeaderProps } from '.';

export const ModalHeader: React.FC<ModalHeaderProps> = ({
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
      className={classnames('mm-modal-header', className)}
      as="header"
      paddingLeft={4}
      paddingRight={4}
      paddingBottom={4}
      childrenWrapperProps={{
        width: BlockSize.Full,
      }}
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
            onClick={onClose}
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
