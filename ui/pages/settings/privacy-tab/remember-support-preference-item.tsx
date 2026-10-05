import React from 'react';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getPreferences } from '../../../../shared/lib/selectors/preferences';
import { setShouldShowSupportConsent } from '../../../store/actions';
import { useDispatch } from '../../../store/hooks';
import { SettingsToggleItem } from '../shared/settings-toggle-item';
import { PRIVACY_ITEMS } from '../search-config';

export const RememberSupportPreferenceToggleItem = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { shouldShowSupportConsent } = useSelector(getPreferences);

  // The toggle is "remember my preference", i.e. the inverse of shouldShowSupportConsent.
  const rememberPreference = shouldShowSupportConsent === false;

  const handleToggle = (currentValue: boolean) => {
    const newRememberPreference = !currentValue;
    dispatch(setShouldShowSupportConsent(!newRememberPreference));
  };

  return (
    <SettingsToggleItem
      title={t(PRIVACY_ITEMS['remember-support-preference'])}
      description={t('rememberSupportPreferenceDescription')}
      value={rememberPreference}
      onToggle={handleToggle}
      dataTestId="remember-support-preference-toggle"
    />
  );
};
