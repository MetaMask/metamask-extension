import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { TextButton } from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getUseExternalServices } from '../../../selectors';
import { toggleExternalServices } from '../../../store/actions';
import { openBasicFunctionalityModal } from '../../../ducks/app/app';
import { SettingsToggleItem } from '../../settings/settings-toggle-item';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';

export const BasicFunctionalityToggleItem = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { trackEvent } = useContext(MetaMetricsContext);
  const useExternalServices = useSelector(getUseExternalServices);

  const handleToggle = (value: boolean) => {
    if (value) {
      dispatch(openBasicFunctionalityModal());
    } else {
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
    }
  };

  const description = t('basicConfigurationDescriptionV2', [
    <TextButton asChild key="privacy-link">
      <a
        href="https://consensys.io/privacy-policy"
        target="_blank"
        rel="noopener noreferrer"
      >
        {t('privacyMsg')}
      </a>
    </TextButton>,
  ]);

  return (
    <SettingsToggleItem
      title={t('basicConfigurationLabel')}
      description={description}
      value={useExternalServices}
      onToggle={handleToggle}
      dataTestId="basic-functionality-toggle"
    />
  );
};
