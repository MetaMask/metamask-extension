import React, { useEffect, useRef } from 'react';

import { toast, ToastContent } from '../../../components/ui/toast/toast';

export const ASSET_ACTIVATION_ERROR_TOAST_DURATION_MS = 5000;

const TOAST_ID = 'asset-activation-error-toast';

export type AssetActivationErrorToastProps = {
  message: string | null;
  onClose: () => void;
};

export const AssetActivationErrorToast = ({
  message,
  onClose,
}: AssetActivationErrorToastProps) => {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!message) {
      toast.dismiss(TOAST_ID);
      return undefined;
    }

    toast.error(
      <ToastContent
        title={message}
        dataTestId="asset-activation-error-container"
      />,
      {
        id: TOAST_ID,
        duration: ASSET_ACTIVATION_ERROR_TOAST_DURATION_MS,
      },
    );

    const timeoutId = window.setTimeout(() => {
      onCloseRef.current();
    }, ASSET_ACTIVATION_ERROR_TOAST_DURATION_MS);

    return () => {
      window.clearTimeout(timeoutId);
      toast.dismiss(TOAST_ID);
    };
  }, [message]);

  return null;
};
