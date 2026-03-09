import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { setSmartAccountRequestsFromDapps } from '../../../store/actions';
import { getPreferences } from '../../../selectors';
import { SettingsToggleItem } from '../../settings/settings-toggle-item';

export const SmartAccountRequestsFromDappsItem = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const preferences = useSelector(getPreferences);
  const value = Boolean(preferences?.smartAccountRequestsFromDapps);

  return (
    <SettingsToggleItem
      title={t('smartAccountRequestsFromDapps')}
      description={t('smartAccountRequestsFromDappsDescription')}
      value={value}
      onToggle={(oldValue: boolean) =>
        dispatch(setSmartAccountRequestsFromDapps(!oldValue))
      }
      containerDataTestId="settings-smart-account-requests-from-dapps"
      dataTestId="settings-page-smart-account-requests-from-dapps-toggle"
    />
  );
};
