import React from 'react';
import classnames from 'classnames';
import { HeaderBase, Text, ButtonIcon, ButtonIconSize, IconName } from '../..';
import {
  TextVariant,
  TextAlign,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { ModalHeaderProps } from '.';

/**
 * @deprecated This version of `ModalHeader` is deprecated. Please use the version from the component-library in ui/components/component-library/modal-header/modal-header.tsx
 * See PR https://github.com/MetaMask/metamask-extension/pull/22207 for details.
 * @param options0
 * @param options0.children
 * @param options0.className
 * @param options0.startAccessory
 * @param options0.endAccessory
 * @param options0.onClose
 * @param options0.closeButtonProps
 * @param options0.onBack
 * @param options0.backButtonProps
 */
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
        <Text
          as="header"
          variant={TextVariant.headingSm}
          textAlign={TextAlign.Center}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </HeaderBase>
  );
};
