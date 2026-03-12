import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Button,
  Icon,
  IconColor,
  IconName,
} from '@metamask/design-system-react';
import {
  DeleteRegulationStatus,
  DATA_DELETION_IN_PROGRESS_STATUSES,
} from '../../../../shared/constants/metametrics';
import DataDeletionErrorModal from '../../../components/app/data-deletion-error-modal';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  getMetaMetricsDataDeletionTimestamp,
  getMetaMetricsDataDeletionStatus,
  getMetaMetricsId,
  getParticipateInMetaMetrics,
  getLatestMetricsEventTimestamp,
} from '../../../selectors';
import { Toast, ToastContainer } from '../../../components/multichain/toast';
import { BorderRadius } from '../../../helpers/constants/design-system';
import DeleteMetametricsModal from './delete-metametrics-modal';
import DeletionInProgressModal from './deletion-in-progress-modal';

export const DeleteMetametricsDataItem = () => {
  const t = useI18nContext();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showDeletionInProgressModal, setShowDeletionInProgressModal] =
    useState(false);
  const [showDataDeletionSuccessToast, setShowDataDeletionSuccessToast] =
    useState(false);

  const metaMetricsId = useSelector(getMetaMetricsId);
  const metaMetricsDataDeletionStatus: DeleteRegulationStatus = useSelector(
    getMetaMetricsDataDeletionStatus,
  );
  const metaMetricsDataDeletionTimestamp = useSelector(
    getMetaMetricsDataDeletionTimestamp,
  );
  const latestMetricsEventTimestamp = useSelector(
    getLatestMetricsEventTimestamp,
  );
  const isMetaMetricsEnabled =
    useSelector(getParticipateInMetaMetrics) && Boolean(metaMetricsId);

  const hasNoPendingDataToDelete =
    metaMetricsDataDeletionTimestamp > latestMetricsEventTimestamp;

  const isDataDeletionInProgress =
    Boolean(metaMetricsId) &&
    DATA_DELETION_IN_PROGRESS_STATUSES.includes(
      metaMetricsDataDeletionStatus,
    ) &&
    hasNoPendingDataToDelete;

  return (
    <>
      <Button
        data-testid="delete-metametrics-button"
        onClick={() =>
          isDataDeletionInProgress
            ? setShowDeletionInProgressModal(true)
            : setShowDeleteModal(true)
        }
        disabled={!isMetaMetricsEnabled}
        className="text-error-default !bg-transparent p-0 text-left"
      >
        {t('deleteMetaMetricsData')}
      </Button>
      {showDeleteModal && (
        <DeleteMetametricsModal
          onClose={() => setShowDeleteModal(false)}
          onSuccess={() => setShowDataDeletionSuccessToast(true)}
          onError={() => setShowErrorModal(true)}
        />
      )}
      {showDeletionInProgressModal && (
        <DeletionInProgressModal
          onClose={() => setShowDeletionInProgressModal(false)}
        />
      )}
      {showErrorModal && (
        <DataDeletionErrorModal onClose={() => setShowErrorModal(false)} />
      )}
      {showDataDeletionSuccessToast && (
        <ToastContainer>
          <Toast
            startAdornment={
              <Icon
                name={IconName.CheckBold}
                color={IconColor.SuccessDefault}
              />
            }
            text={t('deleteMetaMetricsDataToast')}
            onClose={() => setShowDataDeletionSuccessToast(false)}
            autoHideTime={2500}
            onAutoHideToast={() => setShowDataDeletionSuccessToast(false)}
            borderRadius={BorderRadius.LG}
            textClassName="text-base"
            data-testid="delete-metametrics-data-success-toast"
          />
        </ToastContainer>
      )}
    </>
  );
};
