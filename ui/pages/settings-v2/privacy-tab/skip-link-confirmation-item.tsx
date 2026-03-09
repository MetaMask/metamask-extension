import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getPreferences } from '../../../selectors';
import { setSkipDeepLinkInterstitial } from '../../../store/actions';
import { SettingsToggleItem } from '../../settings/settings-toggle-item';

export const SkipLinkConfirmationToggleItem = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { skipDeepLinkInterstitial } = useSelector(getPreferences);

  const handleToggle = (value: boolean) => {
    dispatch(setSkipDeepLinkInterstitial(!value));
  };

  return (
    <SettingsToggleItem
      title={t('skipLinkConfirmationScreens')}
      description={t('skipLinkConfirmationScreensDescription')}
      value={Boolean(skipDeepLinkInterstitial)}
      onToggle={handleToggle}
      dataTestId="skip-link-confirmation-toggle"
    />
  );
};
