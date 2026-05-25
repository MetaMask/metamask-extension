import React, { useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  getDataCollectionForMarketing,
  getParticipateInMetaMetrics,
} from '../../../selectors/metametrics';
import {
  getUseExternalServices,
  getIsSocialLoginFlow,
} from '../../../selectors';
import {
  getMarketingConsent,
  setDataCollectionForMarketing,
  setMarketingConsent,
} from '../../../store/actions';
import { SettingsToggleItem } from '../shared/settings-toggle-item';
import { PRIVACY_ITEMS } from '../search-config';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsUserTrait,
} from '../../../../shared/constants/metametrics';

export const DataCollectionToggleItem = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { trackEvent } = useContext(MetaMetricsContext);

  const dataCollectionForMarketing = useSelector(getDataCollectionForMarketing);
  const useExternalServices = useSelector(getUseExternalServices);
  const socialLoginEnabled = useSelector(getIsSocialLoginFlow);
  const participateInMetaMetrics = useSelector(getParticipateInMetaMetrics);

  // Match legacy Security tab: fetch remote marketing consent when the user is in
  // a social login flow (firstTimeFlowType stays set after seedless import completes).
  useEffect(() => {
    if (!socialLoginEnabled) {
      return;
    }
    let cancelled = false;
    const fetchConsent = async () => {
      const marketingConsentFromRemote = await getMarketingConsent();
      if (!cancelled) {
        dispatch(setDataCollectionForMarketing(marketingConsentFromRemote));
      }
    };
    fetchConsent();
    return () => {
      cancelled = true;
    };
  }, [socialLoginEnabled, dispatch]);

  const isDisabled = !useExternalServices || !participateInMetaMetrics;

  const handleToggle = (currentValue: boolean) => {
    const newValue = !currentValue;

    if (socialLoginEnabled) {
      dispatch(setMarketingConsent(newValue));
    }

    dispatch(setDataCollectionForMarketing(newValue));

    trackEvent({
      category: MetaMetricsEventCategory.Settings,
      event: MetaMetricsEventName.AnalyticsPreferenceSelected,
      properties: {
        /* eslint-disable @typescript-eslint/naming-convention */
        [MetaMetricsUserTrait.IsMetricsOptedIn]: true,
        [MetaMetricsUserTrait.HasMarketingConsent]: Boolean(newValue),
        /* eslint-enable @typescript-eslint/naming-convention */
        location: 'Settings',
      },
    });
  };

  const description = socialLoginEnabled
    ? t('dataCollectionForMarketingDescriptionSocialLogin')
    : t('dataCollectionForMarketingDescription');

  return (
    <SettingsToggleItem
      title={t(PRIVACY_ITEMS['data-collection'])}
      description={description}
      value={dataCollectionForMarketing}
      onToggle={handleToggle}
      dataTestId="data-collection-for-marketing-input"
      containerDataTestId="data-collection-for-marketing-toggle"
      disabled={isDisabled}
    />
  );
};
