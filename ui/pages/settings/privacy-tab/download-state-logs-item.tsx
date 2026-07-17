import React, { useState } from 'react';
import { Button } from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { toast } from '../../../components/ui/toast/toast';
import { PRIVACY_ITEMS } from '../search-config';
import DownloadStateLogsModal from './download-state-logs-modal';

const TOAST_ID = 'download-state-logs-error-toast';

export const DownloadStateLogsItem = () => {
  const t = useI18nContext();
  const [showModal, setShowModal] = useState(false);

  const showErrorToast = () => {
    toast.error(
      {
        title: t('unableToDownload'),
        description: t('stateLogError'),
        dataTestId: TOAST_ID,
        id: TOAST_ID,
      },
      {
        duration: Infinity,
      },
    );
  };

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
          onError={showErrorToast}
        />
      )}
    </>
  );
};
