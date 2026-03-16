import React, { useContext } from 'react';
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
  setDataCollectionForMarketing,
  setMarketingConsent,
} from '../../../store/actions';
import { SettingsToggleItem } from '../../settings/settings-toggle-item';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';

export const DataCollectionToggleItem = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { trackEvent } = useContext(MetaMetricsContext);

  const dataCollectionForMarketing = useSelector(getDataCollectionForMarketing);
  const useExternalServices = useSelector(getUseExternalServices);
  const socialLoginEnabled = useSelector(getIsSocialLoginFlow);
  const participateInMetaMetrics = useSelector(getParticipateInMetaMetrics);

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
        is_metrics_opted_in: true,
        has_marketing_consent: Boolean(newValue),
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
      title={t('dataCollectionForMarketing')}
      description={description}
      value={dataCollectionForMarketing}
      onToggle={handleToggle}
      dataTestId="data-collection-for-marketing-toggle"
      disabled={isDisabled}
    />
  );
};
