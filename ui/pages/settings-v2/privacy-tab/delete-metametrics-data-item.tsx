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
  DATA_DELETION_REQUESTED_STATUSES,
} from '../../../../shared/constants/metametrics';
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
import { PRIVACY_ITEMS } from '../search-config';
import DeleteMetametricsModal from './delete-metametrics-modal';
import DeletionInProgressModal from './deletion-in-progress-modal';

export const DeleteMetametricsDataItem = () => {
  const t = useI18nContext();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeletionInProgressModal, setShowDeletionInProgressModal] =
    useState(false);
  const [showDataDeletionErrorToast, setShowDataDeletionErrorToast] =
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
    DATA_DELETION_REQUESTED_STATUSES.includes(metaMetricsDataDeletionStatus) &&
    hasNoPendingDataToDelete;

  return (
    <>
      <Button
        data-testid="delete-metametrics-data-button"
        onClick={() =>
          isDataDeletionInProgress
            ? setShowDeletionInProgressModal(true)
            : setShowDeleteModal(true)
        }
        disabled={!isMetaMetricsEnabled}
        className="text-error-default !bg-transparent p-0 text-left"
      >
        {t(PRIVACY_ITEMS['delete-metametrics-data'])}
      </Button>
      {showDeleteModal && (
        <DeleteMetametricsModal
          onClose={() => setShowDeleteModal(false)}
          onSuccess={() => setShowDataDeletionSuccessToast(true)}
          onError={() => setShowDataDeletionErrorToast(true)}
        />
      )}
      {showDeletionInProgressModal && (
        <DeletionInProgressModal
          onClose={() => setShowDeletionInProgressModal(false)}
        />
      )}
      {showDataDeletionErrorToast && (
        <ToastContainer>
          <Toast
            startAdornment={
              <Icon name={IconName.Warning} color={IconColor.WarningDefault} />
            }
            text={t('deleteMetaMetricsDataErrorToast')}
            description={t('deleteMetaMetricsDataErrorDesc')}
            onClose={() => setShowDataDeletionErrorToast(false)}
            borderRadius={BorderRadius.LG}
            textClassName="text-base"
            data-testid="delete-metametrics-data-error-toast"
          />
        </ToastContainer>
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
