import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Button } from '@metamask/design-system-react';
import {
  DeleteRegulationStatus,
  DATA_DELETION_REQUESTED_STATUSES,
} from '../../../../shared/constants/metametrics';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  getMetaMetricsDataDeletionStatus,
  getAnalyticsId,
  getCompletedMetaMetricsOnboarding,
  getOptedIn,
} from '../../../selectors';
import { toast, ToastContent } from '../../../components/ui/toast/toast';
import { PRIVACY_ITEMS } from '../search-config';
import DeleteMetametricsModal from './delete-metametrics-modal';
import DeletionInProgressModal from './deletion-in-progress-modal';

export const DeleteMetametricsDataItem = () => {
  const t = useI18nContext();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeletionInProgressModal, setShowDeletionInProgressModal] =
    useState(false);
  const [deletionRequestedThisSession, setDeletionRequestedThisSession] =
    useState(false);

  const analyticsId = useSelector(getAnalyticsId);
  const metaMetricsDataDeletionStatus: DeleteRegulationStatus = useSelector(
    getMetaMetricsDataDeletionStatus,
  );
  const completedMetaMetricsOnboarding = useSelector(
    getCompletedMetaMetricsOnboarding,
  );
  const isOptedIn = useSelector(getOptedIn);
  const isMetaMetricsEnabled =
    completedMetaMetricsOnboarding && isOptedIn && Boolean(analyticsId);

  const isDataDeletionInProgress =
    Boolean(analyticsId) &&
    DATA_DELETION_REQUESTED_STATUSES.includes(metaMetricsDataDeletionStatus) &&
    deletionRequestedThisSession;

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
          onSuccess={() => {
            setDeletionRequestedThisSession(true);
            toast.success(t('deleteMetaMetricsDataToast'), {
              id: 'delete-metametrics-data-success-toast',
            });
          }}
          onError={() => {
            toast.error(
              <ToastContent
                title={t('deleteMetaMetricsDataErrorToast')}
                description={t('deleteMetaMetricsDataErrorDesc')}
              />,
              { id: 'delete-metametrics-data-error-toast' },
            );
          }}
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
