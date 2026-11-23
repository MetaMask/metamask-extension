import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  getDataCollectionForMarketing,
  getOptedIn,
} from '../../../selectors/metametrics';
import {
  getUseExternalServices,
  getIsSocialLoginFlow,
} from '../../../selectors';
import {
  optInToMarketing,
  optOutOfMarketing,
  setDataCollectionForMarketing,
  setMarketingConsent,
} from '../../../store/actions';
import { SettingsToggleItem } from '../shared/settings-toggle-item';
import { PRIVACY_ITEMS } from '../search-config';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { useDispatch } from '../../../store/hooks';
import { useMarketingOptOut } from '../../../hooks/metamask-notifications/useMarketingOptOut';
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

  const dataCollectionForMarketing = useSelector(getDataCollectionForMarketing);
  const useExternalServices = useSelector(getUseExternalServices);
  const isOptedIn = useSelector(getOptedIn);
  const isSocialLoginFlow = useSelector(getIsSocialLoginFlow);

  const trackPreference = useCallback(
    (enabled: boolean) => {
      trackEvent(
        createEventBuilder(MetaMetricsEventName.AnalyticsPreferenceSelected)
          .addCategory(MetaMetricsEventCategory.Settings)
          .addProperties({
            [MetaMetricsUserTrait.IsMetricsOptedIn]: isOptedIn,
            [MetaMetricsUserTrait.HasMarketingConsent]: enabled,
            location: 'Settings',
          })
          .build(),
      );
    },
    [createEventBuilder, isOptedIn, trackEvent],
  );

  const { requestOptOut, sheetProps } = useMarketingOptOut({
    onOptedOut: () => {
      if (isSocialLoginFlow) {
        dispatch(setMarketingConsent(false));
      }
      trackPreference(false);
    },
  });

  const handleToggle = async (currentValue: boolean) => {
    const newValue = !currentValue;

    if (!newValue && (await requestOptOut())) {
      return;
    }

    // Social-login wallets also store the choice server-side so the auth
    // service can create the HubSpot contact for email marketing and learn
    // of opt-outs. A failed sync keeps the local decision; reads that would
    // overwrite the local choice stay removed.
    if (isSocialLoginFlow) {
      dispatch(setMarketingConsent(newValue));
    }

    dispatch(newValue ? optInToMarketing() : optOutOfMarketing());
    trackPreference(newValue);
  };

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
        disabled={!useExternalServices}
      />
      <MarketingConsentSheet
        {...sheetProps}
        title={t('marketingConsentOptOutSheetTitle')}
        description={t('marketingConsentOptOutSheetDescription')}
        confirmLabel={t('marketingConsentOptOutSheetConfirm')}
        testId="marketing-consent-opt-out-sheet"
      />
    </>
  );
};
