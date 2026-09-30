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
import { selectIsSignedIn } from '../../../selectors/identity/authentication';
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
  const { ensurePreferences, refetchPreferences, updatePreferencesSection } =
    useNotificationPreferences();

  const dataCollectionForMarketing = useSelector(getDataCollectionForMarketing);
  const useExternalServices = useSelector(getUseExternalServices);
  const consentDecisionMade = useSelector(getConsentDecisionMade);
  const isOptedIn = useSelector(getOptedIn);
  const isSocialLoginFlow = useSelector(getIsSocialLoginFlow);
  const isSignedIn = useSelector(selectIsSignedIn);
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

  const handleToggle = async (currentValue: boolean) => {
    const newValue = !currentValue;

    if (!newValue && isSignedIn) {
      // The Updates and rewards channels live in AUS, so the warning only
      // applies while signed in. A signed-out user has no AUS preferences:
      // the read always fails and the sheet confirm could never complete.
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
        setError(null);
        setIsConsentSheetOpen(true);
        return;
      }
    }

    dispatch(setDataCollectionForMarketing(newValue));
    trackPreference(newValue);
  };

  const rollBackTurnOff = useCallback(
    async (previousMarketing?: MarketingPreference) => {
      try {
        // Restore consent before channels so channels are never on without it.
        await dispatch(setDataCollectionForMarketing(true));
        if (previousMarketing) {
          await updatePreferencesSection('marketing', previousMarketing);
          listNotifications();
        }
      } catch (rollbackError) {
        console.error('Failed to roll back marketing opt-out:', rollbackError);
      }
    },
    [dispatch, listNotifications, updatePreferencesSection],
  );

  const handleTurnOff = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      // Decide from a fresh read only; the cache may be stale.
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
      try {
        await dispatch(
          setDataCollectionForMarketing(false, { waitForAus: true }),
        );
      } catch (consentError) {
        await rollBackTurnOff(channelsEnabled ? marketing : undefined);
        throw consentError;
      }
      setIsConsentSheetOpen(false);
      trackPreference(false);
    } catch (turnOffError) {
      console.error('Failed to turn off marketing consent:', turnOffError);
      setError(t('notificationsSettingsBoxError'));
    } finally {
      setIsSubmitting(false);
    }
  }, [
    dispatch,
    listNotifications,
    refetchPreferences,
    rollBackTurnOff,
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
