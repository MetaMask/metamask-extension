import React, { useCallback, useEffect, useRef } from 'react';
import { useToaster } from 'react-hot-toast';

import { SECOND } from '../../../../../shared/constants/time';
import { toast } from '../../../../components/ui/toast/toast';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { resolveCancelSpeedupErrorMessage } from './utils';

const TOAST_ID = 'cancel-speedup-error-toast';
const AUTO_HIDE_MS = 5 * SECOND;

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
  const { toasts } = useToaster();
  const hasCalledOnCloseRef = useRef(false);

  const title = isCancel
    ? t('cancelTransactionFailed')
    : t('speedUpTransactionFailed');

  const descriptionKey = resolveCancelSpeedupErrorMessage(errorMessage);
  const description = t(descriptionKey);

  const handleClose = useCallback(() => {
    if (hasCalledOnCloseRef.current) {
      return;
    }
    hasCalledOnCloseRef.current = true;
    onClose();
  }, [onClose]);

  useEffect(() => {
    hasCalledOnCloseRef.current = false;

    toast.error(
      {
        title: title,
        description: description,
        dataTestId: TOAST_ID,
        id: TOAST_ID,
      },
      {
        duration: AUTO_HIDE_MS,
      },
    );

    const timeoutId = setTimeout(handleClose, AUTO_HIDE_MS);

    return () => {
      clearTimeout(timeoutId);
      toast.dismiss(TOAST_ID);
    };
  }, [title, description, handleClose]);

  useEffect(() => {
    const ourToast = toasts.find((toastItem) => toastItem.id === TOAST_ID);
    if (ourToast?.dismissed) {
      handleClose();
    }
  }, [toasts, handleClose]);

  return null;
};
