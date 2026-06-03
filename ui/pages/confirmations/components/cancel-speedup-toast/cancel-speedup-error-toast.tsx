import { createPortal } from 'react-dom';
import React, { useCallback, useEffect } from 'react';
import {
  Icon,
  IconColor,
  IconName,
  Toast,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { resolveCancelSpeedupErrorMessage } from './utils';

const AUTO_HIDE_MS = 5000;

type CancelSpeedupErrorToastProps = {
  isCancel: boolean;
  errorMessage: string;
  onClose: () => void;
};

export const CancelSpeedupErrorToast = ({
  isCancel,
  errorMessage,
  onClose,
}: CancelSpeedupErrorToastProps) => {
  const t = useI18nContext();

  const title = isCancel
    ? t('cancelTransactionFailed')
    : t('speedUpTransactionFailed');

  const descriptionKey = resolveCancelSpeedupErrorMessage(errorMessage);
  const description = t(descriptionKey);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      handleClose();
    }, AUTO_HIDE_MS);

    return () => {
      clearTimeout(timeout);
    };
  }, [handleClose]);

  // Portal to document.body so position:fixed in ToastContainer is not
  // trapped by ancestor transforms inside the transaction list.
  return createPortal(
    <div className="toasts-container">
      <Toast
        startAccessory={
          <Icon name={IconName.CircleX} color={IconColor.ErrorDefault} />
        }
        title={title}
        description={description}
        onClose={handleClose}
        data-testid="cancel-speedup-error-toast"
      />
    </div>,
    document.body,
  );
};
