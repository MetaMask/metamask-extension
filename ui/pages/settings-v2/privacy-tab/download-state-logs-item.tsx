import React, { useState } from 'react';
import {
  Button,
  Icon,
  IconColor,
  IconName,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { Toast, ToastContainer } from '../../../components/multichain/toast';
import { BorderRadius } from '../../../helpers/constants/design-system';
import DownloadStateLogsModal from './download-state-logs-modal';

export const DownloadStateLogsItem = () => {
  const t = useI18nContext();
  const [showModal, setShowModal] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);

  return (
    <>
      <Button
        data-testid="download-state-logs-button"
        onClick={() => setShowModal(true)}
        className="text-text-default !bg-transparent p-0 text-left"
      >
        {t('downloadStateLogs')}
      </Button>
      {showModal && (
        <DownloadStateLogsModal
          onClose={() => setShowModal(false)}
          onError={() => setShowErrorToast(true)}
        />
      )}
      {showErrorToast && (
        <ToastContainer>
          <Toast
            startAdornment={
              <Icon name={IconName.Danger} color={IconColor.ErrorDefault} />
            }
            text={t('stateLogError')}
            onClose={() => setShowErrorToast(false)}
            borderRadius={BorderRadius.LG}
            textClassName="text-base"
            dataTestId="download-state-logs-error-toast"
          />
        </ToastContainer>
      )}
    </>
  );
};
