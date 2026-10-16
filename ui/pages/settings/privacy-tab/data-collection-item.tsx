import React from 'react';
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
import { setDataCollectionForMarketing } from '../../../store/actions';
import { SettingsToggleItem } from '../shared/settings-toggle-item';
import { PRIVACY_ITEMS } from '../search-config';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { useDispatch } from '../../../store/hooks';

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
  const socialLoginEnabled = useSelector(getIsSocialLoginFlow);
  const isOptedIn = useSelector(getOptedIn);

  const handleToggle = (currentValue: boolean) => {
    const newValue = !currentValue;

    dispatch(setDataCollectionForMarketing(newValue));

    trackEvent(
      createEventBuilder(MetaMetricsEventName.AnalyticsPreferenceSelected)
        .addCategory(MetaMetricsEventCategory.Settings)
        .addProperties({
          [MetaMetricsUserTrait.IsMetricsOptedIn]: isOptedIn,
          [MetaMetricsUserTrait.HasMarketingConsent]: Boolean(newValue),
          location: 'Settings',
        })
        .build(),
    );
  };

  const description = socialLoginEnabled
    ? t('dataCollectionForMarketingDescriptionSocialLogin')
    : t('dataCollectionForMarketingDescription');

  return (
    <SettingsToggleItem
      title={t(PRIVACY_ITEMS['data-collection'])}
      description={description}
      value={dataCollectionForMarketing === true}
      onToggle={handleToggle}
      dataTestId="data-collection-for-marketing-input"
      containerDataTestId="data-collection-for-marketing-toggle"
      disabled={!useExternalServices}
    />
  );
};
