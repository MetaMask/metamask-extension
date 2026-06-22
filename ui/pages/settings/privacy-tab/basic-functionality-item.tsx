import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  getExternalServicesOnboardingToggleState,
  getUseExternalServices,
} from '../../../selectors';
import { toggleExternalServices } from '../../../store/actions';
import {
  onboardingToggleBasicFunctionalityOn,
  openBasicFunctionalityModal,
} from '../../../ducks/app/app';
import { SettingsToggleItem } from '../shared/settings-toggle-item';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { PrivacyPolicyLink } from '../shared';
import { PRIVACY_ITEMS } from '../search-config';

type BasicFunctionalityToggleItemProps = {
  isOnboarding?: boolean;
};

export const BasicFunctionalityToggleItem = ({
  isOnboarding = false,
}: BasicFunctionalityToggleItemProps) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { trackEvent } = useContext(MetaMetricsContext);
  const useExternalServices = useSelector(getUseExternalServices);
  const externalServicesOnboardingToggleState = useSelector(
    getExternalServicesOnboardingToggleState,
  );
  const value = isOnboarding
    ? externalServicesOnboardingToggleState
    : useExternalServices;

  const handleToggle = (currentValue: boolean) => {
    if (currentValue) {
      dispatch(openBasicFunctionalityModal());
      return;
    }

    if (isOnboarding) {
      dispatch(onboardingToggleBasicFunctionalityOn());
      trackEvent({
        category: MetaMetricsEventCategory.Onboarding,
        event: MetaMetricsEventName.SettingsUpdated,
        properties: {
          /* eslint-disable @typescript-eslint/naming-convention */
          settings_group: 'onboarding_advanced_configuration',
          settings_type: 'basic_functionality',
          old_value: false,
          new_value: true,
          was_profile_syncing_on: false,
          /* eslint-enable @typescript-eslint/naming-convention */
        },
      });
      return;
    }

    dispatch(toggleExternalServices(true));
    trackEvent({
      category: MetaMetricsEventCategory.Settings,
      event: MetaMetricsEventName.SettingsUpdated,
      properties: {
        /* eslint-disable @typescript-eslint/naming-convention */
        settings_group: 'security_privacy',
        settings_type: 'basic_functionality',
        old_value: false,
        new_value: true,
        was_notifications_on: false,
        was_profile_syncing_on: false,
        /* eslint-enable @typescript-eslint/naming-convention */
      },
    });
  };

  const description = t('basicConfigurationDescriptionV2', [
    <PrivacyPolicyLink key="basic-functionality-privacy-link" />,
  ]);

  return (
    <SettingsToggleItem
      title={t(PRIVACY_ITEMS['basic-functionality'])}
      description={description}
      value={value}
      onToggle={handleToggle}
      dataTestId="basic-functionality-toggle"
    />
  );
};
