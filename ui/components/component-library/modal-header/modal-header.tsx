import React from 'react';
import classnames from 'clsx';
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
 * Please use the ModalHeader component from @metamask/design-system-react instead.
 * @see {@link https://github.com/MetaMask/metamask-design-system/blob/main/packages/design-system-react/MIGRATION.md#modalheader-component | Migration Guide}
 * @see {@link https://metamask.github.io/metamask-design-system/?path=/docs/react-components-modalheader--docs | Storybook Documentation}
 * @see {@link https://github.com/MetaMask/metamask-design-system/tree/main/packages/design-system-react/src/components/ModalHeader | Component Source}
 */
export const ModalHeader = ({
  children,
  className = '',
  startAccessory,
  endAccessory,
  onClose,
  closeButtonProps,
  onBack,
  backButtonProps,
  ...props
}: React.PropsWithChildren<ModalHeaderProps>) => {
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
            size={ButtonIconSize.Md}
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
            size={ButtonIconSize.Md}
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
