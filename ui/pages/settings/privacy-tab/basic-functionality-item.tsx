import React from 'react';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getUseExternalServices } from '../../../selectors';
import {
  toggleBasicFunctionality,
  toggleExternalServices,
} from '../../../store/actions';
import { openBasicFunctionalityModal } from '../../../ducks/app/app';
import { getIsBasicFunctionalityConsolidationEnabled } from '../../../selectors/multichain/feature-flags';
import { SettingsToggleItem } from '../shared/settings-toggle-item';
import { useAnalytics } from '../../../hooks/useAnalytics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { PrivacyPolicyLink } from '../shared';
import { PRIVACY_ITEMS } from '../search-config';
import { useDispatch } from '../../../store/hooks';

export const BasicFunctionalityToggleItem = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { trackEvent, createEventBuilder } = useAnalytics();
  const useExternalServices = useSelector(getUseExternalServices);
  const isBasicFunctionalityConsolidationEnabled = useSelector(
    getIsBasicFunctionalityConsolidationEnabled,
  );

  const handleToggle = (value: boolean) => {
    if (value) {
      dispatch(openBasicFunctionalityModal());
    } else {
      dispatch(
        isBasicFunctionalityConsolidationEnabled
          ? toggleBasicFunctionality(true)
          : toggleExternalServices(true),
      );
      trackEvent(
        createEventBuilder(MetaMetricsEventName.SettingsUpdated)
          .addCategory(MetaMetricsEventCategory.Settings)
          .addProperties({
            /* eslint-disable @typescript-eslint/naming-convention */
            settings_group: 'security_privacy',
            settings_type: 'basic_functionality',
            old_value: false,
            new_value: true,
            was_notifications_on: false,
            was_profile_syncing_on: false,
            /* eslint-enable @typescript-eslint/naming-convention */
          })
          .build(),
      );
    }
  };

  const description = t('basicConfigurationDescriptionV2', [
    <PrivacyPolicyLink key="basic-functionality-privacy-link" />,
  ]);

  return (
    <SettingsToggleItem
      title={t(PRIVACY_ITEMS['basic-functionality'])}
      description={description}
      value={useExternalServices}
      onToggle={handleToggle}
      dataTestId="basic-functionality-toggle"
    />
  );
};
