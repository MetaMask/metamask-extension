import { Button, toast } from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { PRIVACY_ITEMS } from '../search-config';
import DownloadStateLogsModal from './download-state-logs-modal';
import React, { useState } from 'react';

const TOAST_VISIBLE_DURATION_MS = 2500;

export const DownloadStateLogsItem = () => {
  const t = useI18nContext();
  const [showModal, setShowModal] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);

  React.useEffect(() => {
    if (!showErrorToast) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      setShowErrorToast(false);
    }, TOAST_VISIBLE_DURATION_MS);

    toast({
      severity: 'danger',
      title: t('unableToDownload'),
      description: t('stateLogError'),
      'data-testid': 'download-state-logs-error-toast',
      hasNoTimeout: true,
      onClose: () => setShowErrorToast(false),
    });

    return () => {
      clearTimeout(timeoutId);
      toast.dismiss();
    };
  }, [showErrorToast, t]);

  return (
    <>
      <Button
        data-testid="advanced-setting-state-logs-button"
        onClick={() => setShowModal(true)}
        className="text-text-default !bg-transparent p-0 text-left mx-4"
      >
        {t(PRIVACY_ITEMS['download-state-logs'])}
      </Button>
      {showModal && (
        <DownloadStateLogsModal
          onClose={() => setShowModal(false)}
          onError={() => setShowErrorToast(true)}
        />
      )}
    </>
  );
};
