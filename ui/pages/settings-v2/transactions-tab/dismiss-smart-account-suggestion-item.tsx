import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { setDismissSmartAccountSuggestionEnabled } from '../../../store/actions';
import { getPreferences } from '../../../selectors';
import { SettingsToggleItem } from '../../settings/settings-toggle-item';

export const DismissSmartAccountSuggestionItem = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const preferences = useSelector(getPreferences);
  const value = Boolean(preferences?.dismissSmartAccountSuggestionEnabled);

  return (
    <SettingsToggleItem
      title={t('dismissSmartAccountSuggestionEnabledTitle')}
      description={t('dismissSmartAccountSuggestionEnabledDescription')}
      value={value}
      onToggle={(oldValue: boolean) =>
        dispatch(setDismissSmartAccountSuggestionEnabled(!oldValue))
      }
      containerDataTestId="advanced-setting-dismiss-smart-account-suggestion-enabled"
      dataTestId="settings-page-dismiss-smart-account-suggestion-enabled-toggle"
    />
  );
};
