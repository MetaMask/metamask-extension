import React from 'react';
import classnames from 'classnames';
import { Text } from '../text';
import {
  TextVariant,
  TextAlign,
  BlockSize,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { ButtonIcon, ButtonIconSize } from '../button-icon';
import { IconName } from '../icon';
import { HeaderBase } from '../header-base';
import { ModalHeaderProps } from './modal-header.types';

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
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
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
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
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
