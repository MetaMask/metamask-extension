import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Text, TextColor, TextVariant } from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useAnalytics } from '../../../hooks/useAnalytics';
import {
  useEnableMetametrics,
  useDisableMetametrics,
} from '../../../hooks/useMetametrics';
import { selectIsBackupAndSyncEnabled } from '../../../selectors/identity/backup-and-sync';
import {
  getOptedIn,
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
  MetaMetricsUserTrait,
} from '../../../../shared/constants/metametrics';
import { SettingsToggleItem } from '../shared/settings-toggle-item';
import { PRIVACY_ITEMS } from '../search-config';

export const MetametricsToggleItem = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { trackEvent, createEventBuilder } = useAnalytics();
  const { enableMetametrics, error: enableMetametricsError } =
    useEnableMetametrics();
  const { disableMetametrics, error: disableMetametricsError } =
    useDisableMetametrics();

  const error = enableMetametricsError ?? disableMetametricsError;

  const isBackupAndSyncEnabled = useSelector(selectIsBackupAndSyncEnabled);
  const isOptedIn = useSelector(getOptedIn);
  const useExternalServices = useSelector(getUseExternalServices);
  const dataCollectionForMarketing = useSelector(getDataCollectionForMarketing);
  const socialLoginEnabled = useSelector(getIsSocialLoginFlow);

  const handleToggle = async (currentValue: boolean) => {
    const newValue = !currentValue;

    if (newValue) {
      await enableMetametrics();
      trackEvent(
        createEventBuilder(MetaMetricsEventName.TurnOnMetaMetrics)
          .addCategory(MetaMetricsEventCategory.Settings)
          .addProperties({
            isProfileSyncingEnabled: isBackupAndSyncEnabled,
            participateInMetaMetrics: isOptedIn,
            location: 'Settings',
          })
          .build(),
      );
    } else {
      if (dataCollectionForMarketing) {
        if (socialLoginEnabled) {
          dispatch(setMarketingConsent(false));
        }
        dispatch(setDataCollectionForMarketing(false));
      }

      trackEvent(
        createEventBuilder(MetaMetricsEventName.TurnOffMetaMetrics)
          .addCategory(MetaMetricsEventCategory.Settings)
          .addProperties({
            isProfileSyncingEnabled: isBackupAndSyncEnabled,
            participateInMetaMetrics: isOptedIn,
          })
          .build(),
      );

      trackEvent(
        createEventBuilder(MetaMetricsEventName.AnalyticsPreferenceSelected)
          .addCategory(MetaMetricsEventCategory.Settings)
          .addProperties({
            [MetaMetricsUserTrait.IsMetricsOptedIn]: false,
            [MetaMetricsUserTrait.HasMarketingConsent]: false,
            location: 'Settings',
          })
          .build(),
      );

      await disableMetametrics();
    }
  };

  return (
    <>
      <SettingsToggleItem
        title={t(PRIVACY_ITEMS.metametrics)}
        description={t('participateInMetaMetricsDescription')}
        value={isOptedIn}
        onToggle={handleToggle}
        dataTestId="participate-in-meta-metrics-input"
        containerDataTestId="participate-in-meta-metrics-toggle"
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
