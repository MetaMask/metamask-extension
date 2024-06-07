import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CONSENSYS_PRIVACY_LINK } from '../../../../../shared/lib/ui-utils';
import ClearMetametricsData from '../../../../components/app/clear-metametrics-data';
import { Box, ButtonPrimary } from '../../../../components/component-library';
import {
  Display,
  FlexDirection,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  getMetaMetricsDataDeletionDate,
  getMetaMetricsDataDeletionStatus,
  getMetaMetricsId,
  getShowDataDeletionErrorModal,
  getShowDeleteMetaMetricsDataModal,
  hasRecordedMetricsSinceDeletion,
  isMetaMetricsDataDeletionMarked,
} from '../../../../selectors';
import { openDeleteMetaMetricsDataModal } from '../../../../ducks/app/app';
import DataDeletionErrorModal from '../../../../components/app/data-deletion-error-modal';
import { formatDate } from '../../../../helpers/utils/util';
import { DeleteRegulationStatus } from '../../../../../shared/constants/metametrics';

const DeleteMetaMetricsDataToggle = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();

  const metaMetricsId = useSelector(getMetaMetricsId);
  const hasMetricsRecordedAfterDeletion = useSelector(
    hasRecordedMetricsSinceDeletion,
  );
  const metaMetricsDataDeletionStatus = useSelector(
    getMetaMetricsDataDeletionStatus,
  );
  const metaMetricsDataDeletionDate = useSelector(
    getMetaMetricsDataDeletionDate,
  );
  const formatedDate = formatDate(metaMetricsDataDeletionDate, 'd/MM/y');

  const metaMetricsDataDeletionMarked = useSelector(
    isMetaMetricsDataDeletionMarked,
  );
  const showDeleteMetaMetricsDataModal = useSelector(
    getShowDeleteMetaMetricsDataModal,
  );
  const showDataDeletionErrorModal = useSelector(getShowDataDeletionErrorModal);

  let dataDeletionButtonDisabled =
    metaMetricsDataDeletionMarked || Boolean(!metaMetricsId);
  if (!dataDeletionButtonDisabled && metaMetricsDataDeletionStatus) {
    dataDeletionButtonDisabled =
      [
        DeleteRegulationStatus.INITIALIZED,
        DeleteRegulationStatus.RUNNING,
        DeleteRegulationStatus.FINISHED,
      ].includes(metaMetricsDataDeletionStatus) &&
      !hasMetricsRecordedAfterDeletion;
  }

  const privacyPolicyLink = (
    <a
      href={CONSENSYS_PRIVACY_LINK}
      target="_blank"
      rel="noopener noreferrer"
      key="metametrics-consensys-privacy-link"
    >
      {t('privacyMsg')}
    </a>
  );
  return (
    <>
      <Box
        className="settings-page__content-row"
        data-testid="delete-metametrics-data-toggle"
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        gap={4}
      >
        <div className="settings-page__content-item">
          <span>{t('deleteMetaMetricsData')}</span>
          <div className="settings-page__content-description">
            {dataDeletionButtonDisabled
              ? t('deleteMetaMetricsDataRequestedDescription', [
                  formatedDate,
                  privacyPolicyLink,
                ])
              : t('deleteMetaMetricsDataDescription', [privacyPolicyLink])}
          </div>
        </div>
        <div className="settings-page__content-item-col">
          <ButtonPrimary
            className="settings-page__button"
            onClick={() => {
              dispatch(openDeleteMetaMetricsDataModal());
            }}
            disabled={dataDeletionButtonDisabled}
          >
            {t('deleteMetaMetricsData')}
          </ButtonPrimary>
        </div>
      </Box>
      {showDeleteMetaMetricsDataModal && <ClearMetametricsData />}
      {showDataDeletionErrorModal && <DataDeletionErrorModal />}
    </>
  );
};

export default DeleteMetaMetricsDataToggle;
