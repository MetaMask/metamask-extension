import React, { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import type { MarketingPreference } from '@metamask/authenticated-user-storage';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  getConsentDecisionMade,
  getDataCollectionForMarketing,
  getOptedIn,
} from '../../../selectors/metametrics';
import { getUseExternalServices } from '../../../selectors';
import { getIsSocialLoginFlow } from '../../../selectors/first-time-flow';
import { setDataCollectionForMarketing } from '../../../store/actions';
import { SettingsToggleItem } from '../shared/settings-toggle-item';
import { PRIVACY_ITEMS } from '../search-config';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { useDispatch } from '../../../store/hooks';
import { useNotificationPreferences } from '../../../hooks/metamask-notifications/useNotificationPreferences';
import { useMetamaskNotificationsContext } from '../../../contexts/metamask-notifications/metamask-notifications';
import { MarketingConsentSheet } from '../../../components/app/marketing-consent-sheet/marketing-consent-sheet';

import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsUserTrait,
} from '../../../../shared/constants/metametrics';

export const DataCollectionToggleItem = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { trackEvent, createEventBuilder } = useAnalytics();
  const { listNotifications } = useMetamaskNotificationsContext();
  const {
    preferences,
    isLoading: isLoadingNotificationPreferences,
    error: notificationPreferencesError,
    refetchPreferences,
    updatePreferencesSection,
  } = useNotificationPreferences();

  const dataCollectionForMarketing = useSelector(getDataCollectionForMarketing);
  const useExternalServices = useSelector(getUseExternalServices);
  const consentDecisionMade = useSelector(getConsentDecisionMade);
  const isOptedIn = useSelector(getOptedIn);
  const isSocialLoginFlow = useSelector(getIsSocialLoginFlow);
  const [isConsentSheetOpen, setIsConsentSheetOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDisabled =
    !useExternalServices || !(consentDecisionMade && isOptedIn);

  const trackPreference = useCallback(
    (enabled: boolean) => {
      trackEvent(
        createEventBuilder(MetaMetricsEventName.AnalyticsPreferenceSelected)
          .addCategory(MetaMetricsEventCategory.Settings)
          .addProperties({
            [MetaMetricsUserTrait.IsMetricsOptedIn]: true,
            [MetaMetricsUserTrait.HasMarketingConsent]: enabled,
            location: 'Settings',
          })
          .build(),
      );
    },
    [createEventBuilder, trackEvent],
  );

  const handleToggle = (currentValue: boolean) => {
    const newValue = !currentValue;

    if (
      !newValue &&
      (preferences?.marketing?.pushNotificationsEnabled ||
        preferences?.marketing?.inAppNotificationsEnabled ||
        isLoadingNotificationPreferences ||
        Boolean(notificationPreferencesError))
    ) {
      setError(null);
      setIsConsentSheetOpen(true);
      return;
    }

    dispatch(setDataCollectionForMarketing(newValue));
    trackPreference(newValue);
  };

  const handleTurnOff = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);
    let marketing: MarketingPreference | undefined;
    let preferencesUpdated = false;
    try {
      const fetchedPreferences = await refetchPreferences();
      if (fetchedPreferences.error) {
        throw fetchedPreferences.error;
      }
      marketing = fetchedPreferences.data?.marketing ?? preferences?.marketing;
      if (
        marketing?.pushNotificationsEnabled ||
        marketing?.inAppNotificationsEnabled
      ) {
        await updatePreferencesSection('marketing', {
          ...marketing,
          pushNotificationsEnabled: false,
          inAppNotificationsEnabled: false,
        });
        preferencesUpdated = true;
      }
      await dispatch(
        setDataCollectionForMarketing(false, { waitForAus: true }),
      );
      setIsConsentSheetOpen(false);
      trackPreference(false);
      if (preferencesUpdated) {
        listNotifications();
      }
    } catch (updateError) {
      if (preferencesUpdated) {
        try {
          if (marketing) {
            await updatePreferencesSection('marketing', marketing);
          }
          listNotifications();
        } catch {
          // Keep the warning open so the user can retry.
        }
      }
      setError(
        updateError instanceof Error
          ? updateError.message
          : t('notificationsSettingsBoxError'),
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    dispatch,
    listNotifications,
    preferences,
    refetchPreferences,
    t,
    trackPreference,
    updatePreferencesSection,
  ]);

  return (
    <>
      <SettingsToggleItem
        title={t(PRIVACY_ITEMS['data-collection'])}
        description={t(
          isSocialLoginFlow
            ? 'dataCollectionForMarketingDescriptionSocialLogin'
            : 'dataCollectionForMarketingDescription',
        )}
        value={dataCollectionForMarketing === true}
        onToggle={handleToggle}
        dataTestId="data-collection-for-marketing-input"
        containerDataTestId="data-collection-for-marketing-toggle"
        disabled={isDisabled}
      />
      <MarketingConsentSheet
        isOpen={isConsentSheetOpen}
        isSubmitting={isSubmitting}
        title={t('marketingConsentOptOutSheetTitle')}
        description={t('marketingConsentOptOutSheetDescription')}
        confirmLabel={t('marketingConsentOptOutSheetConfirm')}
        testId="marketing-consent-opt-out-sheet"
        error={error}
        onClose={() => setIsConsentSheetOpen(false)}
        onConfirm={handleTurnOff}
      />
    </>
  );
};
