import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { setUseMultiAccountBalanceChecker } from '../../../store/actions';
import { SettingsToggleItem } from '../../settings/settings-toggle-item';
import type { MetaMaskReduxState } from '../../../store/store';

export const BatchAccountBalanceRequestsToggleItem = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const useMultiAccountBalanceChecker = useSelector(
    (state: MetaMaskReduxState) => state.metamask.useMultiAccountBalanceChecker,
  );

  const handleToggle = (value: boolean) => {
    dispatch(setUseMultiAccountBalanceChecker(!value));
  };

  return (
    <SettingsToggleItem
      title={t('useMultiAccountBalanceChecker')}
      description={t('useMultiAccountBalanceCheckerSettingDescriptionV2')}
      value={useMultiAccountBalanceChecker}
      onToggle={handleToggle}
      dataTestId="batch-account-balance-requests-toggle"
    />
  );
};
