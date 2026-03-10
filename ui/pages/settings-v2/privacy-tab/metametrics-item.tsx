import React, { useContext } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Text, TextColor, TextVariant } from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  useEnableMetametrics,
  useDisableMetametrics,
} from '../../../hooks/useMetametrics';
import { selectIsBackupAndSyncEnabled } from '../../../selectors/identity/backup-and-sync';
import {
  getParticipateInMetaMetrics,
  getUseExternalServices,
  getIsSocialLoginFlow,
} from '../../../selectors';
import { getDataCollectionForMarketing } from '../../../selectors/metametrics';
import {
  setDataCollectionForMarketing,
  setMarketingConsent,
} from '../../../store/actions';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { SettingsToggleItem } from '../../settings/settings-toggle-item';

export const MetametricsToggleItem = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { trackEvent } = useContext(MetaMetricsContext);
  const { enableMetametrics, error: enableMetametricsError } =
    useEnableMetametrics();
  const { disableMetametrics, error: disableMetametricsError } =
    useDisableMetametrics();

  const error = enableMetametricsError ?? disableMetametricsError;

  const isBackupAndSyncEnabled = useSelector(selectIsBackupAndSyncEnabled);
  const participateInMetaMetrics = useSelector(getParticipateInMetaMetrics);
  const useExternalServices = useSelector(getUseExternalServices);
  const dataCollectionForMarketing = useSelector(getDataCollectionForMarketing);
  const socialLoginEnabled = useSelector(getIsSocialLoginFlow);

  const handleToggle = async (currentValue: boolean) => {
    const newValue = !currentValue;

    if (newValue) {
      await enableMetametrics();
      trackEvent({
        category: MetaMetricsEventCategory.Settings,
        event: MetaMetricsEventName.TurnOnMetaMetrics,
        properties: {
          isProfileSyncingEnabled: isBackupAndSyncEnabled,
          participateInMetaMetrics,
          location: 'Settings',
        },
      });
    } else {
      if (dataCollectionForMarketing) {
        if (socialLoginEnabled) {
          dispatch(setMarketingConsent(false));
        }
        dispatch(setDataCollectionForMarketing(false));
      }

      await disableMetametrics();
      trackEvent({
        category: MetaMetricsEventCategory.Settings,
        event: MetaMetricsEventName.TurnOffMetaMetrics,
        properties: {
          isProfileSyncingEnabled: isBackupAndSyncEnabled,
          participateInMetaMetrics,
        },
      });

      trackEvent({
        category: MetaMetricsEventCategory.Settings,
        event: MetaMetricsEventName.AnalyticsPreferenceSelected,
        properties: {
          /* eslint-disable @typescript-eslint/naming-convention */
          is_metrics_opted_in: false,
          has_marketing_consent: false,
          /* eslint-enable @typescript-eslint/naming-convention */
          location: 'Settings',
        },
      });
    }
  };

  return (
    <>
      <SettingsToggleItem
        title={t('participateInMetaMetrics')}
        description={t('participateInMetaMetricsDescription')}
        value={participateInMetaMetrics}
        onToggle={handleToggle}
        dataTestId="participate-in-meta-metrics-toggle"
        disabled={!useExternalServices}
      />
      {error && (
        <Text color={TextColor.ErrorDefault} variant={TextVariant.BodySm}>
          {t('notificationsSettingsBoxError')}
        </Text>
      )}
    </>
  );
};
