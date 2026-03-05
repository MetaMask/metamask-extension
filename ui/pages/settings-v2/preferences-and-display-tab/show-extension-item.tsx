import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getShowExtensionInFullSizeView } from '../../../selectors';
import { setShowExtensionInFullSizeView } from '../../../store/actions';
import { SettingsToggleItem } from '../../settings/settings-toggle-item';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';

export const ShowExtensionItem = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { trackEvent } = useContext(MetaMetricsContext);
  const showExtensionInFullSizeView = useSelector(
    getShowExtensionInFullSizeView,
  );

  const handleToggle = (value: boolean) => {
    dispatch(setShowExtensionInFullSizeView(!value));
    trackEvent({
      event: MetaMetricsEventName.SettingsUpdated,
      category: MetaMetricsEventCategory.Settings,
      properties: {
        /* eslint-disable @typescript-eslint/naming-convention */
        settings_group: 'preferences_and_display',
        settings_type: 'open_full_screen',
        old_value: value,
        new_value: !value,
        open_full_screen: !value,
        /* eslint-enable @typescript-eslint/naming-convention */
        location: 'Preferences and Display Settings',
      },
    });
  };

  return (
    <SettingsToggleItem
      title={t('showExtensionInFullSizeView')}
      description={t('showExtensionInFullSizeViewDescription')}
      value={showExtensionInFullSizeView}
      onToggle={handleToggle}
      dataTestId="show-extension-in-full-size-view"
    />
  );
};
