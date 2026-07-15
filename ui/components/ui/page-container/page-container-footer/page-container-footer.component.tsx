import React, { type ReactNode } from 'react';
import classnames from 'clsx';
import {
  Button,
  ButtonSize,
  ButtonVariant,
} from '../../../component-library/button';
import { IconName } from '../../../component-library';
import { useI18nContext } from '../../../../hooks/useI18nContext';

type PageContainerFooterProps = {
  children?: ReactNode;
  onCancel?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  cancelText?: string;
  cancelButtonType?: string;
  onSubmit?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  submitText?: string;
  disabled?: boolean;
  submitButtonType?: string;
  hideCancel?: boolean;
  footerClassName?: string;
  footerButtonClassName?: string;
  submitButtonIcon?: IconName;
};

export default function PageContainerFooter({
  children,
  onCancel,
  cancelText,
  onSubmit,
  submitText,
  disabled,
  submitButtonType,
  hideCancel,
  cancelButtonType,
  footerClassName,
  footerButtonClassName,
  submitButtonIcon,
}: PageContainerFooterProps) {
  const t = useI18nContext();

  const submitVariant: ButtonVariant =
    submitButtonType === 'confirm'
      ? ButtonVariant.Primary
      : (submitButtonType as ButtonVariant | undefined) ?? ButtonVariant.Primary;

  const cancelVariant: ButtonVariant =
    cancelButtonType === 'default'
      ? ButtonVariant.Secondary
      : (cancelButtonType as ButtonVariant | undefined) ?? ButtonVariant.Secondary;

  return (
    <div className={classnames('page-container__footer', footerClassName)}>
      <footer>
        {!hideCancel && (
          <Button
            size={ButtonSize.Lg}
            variant={cancelVariant}
            className={classnames(
              'page-container__footer-button',
              'page-container__footer-button__cancel',
              footerButtonClassName,
            )}
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => onCancel?.(e)}
            data-testid="page-container-footer-cancel"
            block
          >
            {cancelText || t('cancel')}
          </Button>
        )}

        <Button
          size={ButtonSize.Lg}
          variant={submitVariant}
          className={classnames(
            'page-container__footer-button',
            footerButtonClassName,
          )}
          disabled={disabled}
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => onSubmit?.(e)}
          data-testid="page-container-footer-next"
          startIconName={submitButtonIcon}
          block
        >
          {submitText || t('next')}
        </Button>
      </footer>

      {children && (
        <div className="page-container__footer-secondary">{children}</div>
      )}
    </div>
  );
}
