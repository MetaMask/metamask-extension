import { useSelector } from 'react-redux';
import { Button, toast } from '@metamask/design-system-react';
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
import { PRIVACY_ITEMS } from '../search-config';
import DeleteMetametricsModal from './delete-metametrics-modal';
import DeletionInProgressModal from './deletion-in-progress-modal';
import React, { useEffect, useState } from 'react';

const TOAST_VISIBLE_DURATION_MS = 2500;

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

  useEffect(() => {
    if (!showDataDeletionErrorToast) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      setShowDataDeletionErrorToast(false);
    }, TOAST_VISIBLE_DURATION_MS);

    toast({
      severity: 'danger',
      title: t('deleteMetaMetricsDataErrorToast'),
      description: t('deleteMetaMetricsDataErrorDesc'),
      'data-testid': 'delete-metametrics-data-error-toast',
      hasNoTimeout: true,
      onClose: () => setShowDataDeletionErrorToast(false),
    });

    return () => {
      clearTimeout(timeoutId);
      toast.dismiss();
    };
  }, [showDataDeletionErrorToast, t]);

  useEffect(() => {
    if (!showDataDeletionSuccessToast) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      setShowDataDeletionSuccessToast(false);
    }, TOAST_VISIBLE_DURATION_MS);

    toast({
      severity: 'success',
      title: t('deleteMetaMetricsDataToast'),
      'data-testid': 'delete-metametrics-data-success-toast',
      hasNoTimeout: true,
      onClose: () => setShowDataDeletionSuccessToast(false),
    });

    return () => {
      clearTimeout(timeoutId);
      toast.dismiss();
    };
  }, [showDataDeletionSuccessToast, t]);

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
        className="text-error-default !bg-transparent p-0 text-left mx-4"
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
    </>
  );
};
