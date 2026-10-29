import React, { useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Icon, IconColor, IconName } from '@metamask/design-system-react';
import {
  Toast,
  ToastContainer,
} from '../../../../components/multichain/toast/toast';
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

  // Portal to document.body so position:fixed in ToastContainer is not
  // trapped by ancestor transforms inside the transaction list.
  return createPortal(
    <ToastContainer>
      <Toast
        startAdornment={
          <Icon name={IconName.CircleX} color={IconColor.ErrorDefault} />
        }
        text={title}
        description={description}
        onClose={handleClose}
        autoHideTime={AUTO_HIDE_MS}
        onAutoHideToast={handleClose}
        dataTestId="cancel-speedup-error-toast"
      />
    </ToastContainer>,
    document.body,
  );
};
