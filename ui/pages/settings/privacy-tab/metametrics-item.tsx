import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Text, TextColor, TextVariant } from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useAnalytics } from '../../../hooks/useAnalytics';
import {
  useEnableMetametrics,
  useDisableMetametrics,
} from '../../../hooks/useMetametrics';
import { selectIsBackupAndSyncEnabled } from '../../../selectors/identity/backup-and-sync';
import { getOptedIn, getUseExternalServices } from '../../../selectors';
import { getDataCollectionForMarketing } from '../../../selectors/metametrics';
import { selectIsSignedIn } from '../../../selectors/identity/authentication';
import { setDataCollectionForMarketing } from '../../../store/actions';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsUserTrait,
} from '../../../../shared/constants/metametrics';
import { SettingsToggleItem } from '../shared/settings-toggle-item';
import { PRIVACY_ITEMS } from '../search-config';
import { useDispatch } from '../../../store/hooks';
import { useNotificationPreferences } from '../../../hooks/metamask-notifications/useNotificationPreferences';
import { useMetamaskNotificationsContext } from '../../../contexts/metamask-notifications/metamask-notifications';
import { MarketingConsentSheet } from '../../../components/app/marketing-consent-sheet/marketing-consent-sheet';

export const MetametricsToggleItem = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { trackEvent, createEventBuilder } = useAnalytics();
  const { listNotifications } = useMetamaskNotificationsContext();
  const { ensurePreferences, refetchPreferences, updatePreferencesSection } =
    useNotificationPreferences();
  const { enableMetametrics, error: enableMetametricsError } =
    useEnableMetametrics();
  const { disableMetametrics, error: disableMetametricsError } =
    useDisableMetametrics();

  const error = enableMetametricsError ?? disableMetametricsError;

  const isBackupAndSyncEnabled = useSelector(selectIsBackupAndSyncEnabled);
  const isOptedIn = useSelector(getOptedIn);
  const useExternalServices = useSelector(getUseExternalServices);
  const dataCollectionForMarketing = useSelector(getDataCollectionForMarketing);
  const isSignedIn = useSelector(selectIsSignedIn);
  const [isConsentSheetOpen, setIsConsentSheetOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [consentSheetError, setConsentSheetError] = useState<string | null>(
    null,
  );

  const finishTurningOffMetametrics = async (clearMarketingConsent = true) => {
    if (clearMarketingConsent && dataCollectionForMarketing) {
      await dispatch(setDataCollectionForMarketing(false));
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
  };

  const handleToggle = async (currentValue: boolean) => {
    if (currentValue && isSignedIn) {
      let needsWarning = true;
      try {
        const marketing = (await ensurePreferences())?.marketing;
        needsWarning = Boolean(
          marketing?.pushNotificationsEnabled ||
          marketing?.inAppNotificationsEnabled,
        );
      } catch {
        // Unknown channel state; keep the warning.
      }
      if (needsWarning) {
        setConsentSheetError(null);
        setIsConsentSheetOpen(true);
        return;
      }
    }

    if (!currentValue) {
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
      return;
    }

    await finishTurningOffMetametrics();
  };

  const handleConfirmTurnOff = async () => {
    setIsSubmitting(true);
    setConsentSheetError(null);
    try {
      const { data } = await refetchPreferences({ throwOnError: true });
      const marketing = data?.marketing;
      const channelsEnabled = Boolean(
        marketing?.pushNotificationsEnabled ||
        marketing?.inAppNotificationsEnabled,
      );

      if (marketing && channelsEnabled) {
        await updatePreferencesSection('marketing', {
          ...marketing,
          pushNotificationsEnabled: false,
          inAppNotificationsEnabled: false,
        });
        listNotifications();
      }

      if (dataCollectionForMarketing) {
        await dispatch(
          setDataCollectionForMarketing(false, { waitForAus: true }),
        );
      }
      await finishTurningOffMetametrics(false);
      setIsConsentSheetOpen(false);
    } catch (turnOffError) {
      setConsentSheetError(
        turnOffError instanceof Error
          ? turnOffError.message
          : 'Unable to update marketing preferences',
      );
    } finally {
      setIsSubmitting(false);
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
      <MarketingConsentSheet
        isOpen={isConsentSheetOpen}
        isSubmitting={isSubmitting}
        title={t('marketingConsentOptOutSheetTitle')}
        description={t('marketingConsentOptOutSheetDescription')}
        confirmLabel={t('marketingConsentOptOutSheetConfirm')}
        testId="metametrics-marketing-consent-sheet"
        error={consentSheetError}
        onClose={() => setIsConsentSheetOpen(false)}
        onConfirm={handleConfirmTurnOff}
      />
      {error && (
        <Text color={TextColor.ErrorDefault} variant={TextVariant.BodySm}>
          {t('notificationsSettingsBoxError')}
        </Text>
      )}
    </>
  );
};
