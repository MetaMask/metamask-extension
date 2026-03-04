import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getShouldHideZeroBalanceTokens } from '../../../selectors';
import { setHideZeroBalanceTokens } from '../../../store/actions';
import { SettingsToggleItem } from '../../settings/settings-toggle-item';

export const HideZeroBalanceTokensToggleItem = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const hideZeroBalanceTokens = useSelector(getShouldHideZeroBalanceTokens);

  return (
    <SettingsToggleItem
      title={t('hideZeroBalanceTokens')}
      value={hideZeroBalanceTokens}
      onToggle={(value) => dispatch(setHideZeroBalanceTokens(!value))} // TODO: add event?
      containerDataTestId="hide-zero-balance-tokens"
      dataTestId="toggle-zero-balance-button"
    />
  );
};
