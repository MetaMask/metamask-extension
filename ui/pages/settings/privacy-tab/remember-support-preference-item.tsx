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
  const { shouldShowSupportConsent, supportDataSharingPreference } =
    useSelector(getPreferences);

  // The toggle is "remember my preference", i.e. the inverse of shouldShowSupportConsent.
  const rememberPreference = shouldShowSupportConsent === false;

  const handleToggle = (currentValue: boolean) => {
    const newRememberPreference = !currentValue;
    dispatch(setShouldShowSupportConsent(!newRememberPreference));
  };

  let description = t('rememberSupportPreferenceDescription');
  if (
    supportDataSharingPreference !== null &&
    supportDataSharingPreference !== undefined
  ) {
    const currentDecision = supportDataSharingPreference
      ? t('rememberSupportPreferenceCurrentlySharing')
      : t('rememberSupportPreferenceCurrentlyNotSharing');
    description = `${description} ${currentDecision}`;
  }

  return (
    <SettingsToggleItem
      title={t(PRIVACY_ITEMS['remember-support-preference'])}
      description={description}
      value={rememberPreference}
      onToggle={handleToggle}
      dataTestId="remember-support-preference-toggle"
    />
  );
};
