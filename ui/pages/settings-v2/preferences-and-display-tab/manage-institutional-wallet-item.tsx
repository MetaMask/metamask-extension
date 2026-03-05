import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getManageInstitutionalWallets } from '../../../selectors';
import { setManageInstitutionalWallets } from '../../../store/actions';
import { SettingsToggleItem } from '../../settings/settings-toggle-item';

export const ManageInstitutionalWalletItem = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const manageInstitutionalWallets = useSelector(getManageInstitutionalWallets);

  const handleToggle = (value: boolean) => {
    dispatch(setManageInstitutionalWallets(!value));
  };

  return (
    <SettingsToggleItem
      title={t('manageInstitutionalWallets')}
      description={t('manageInstitutionalWalletsDescription')}
      value={manageInstitutionalWallets}
      onToggle={handleToggle}
      dataTestId="manage-institutional-wallets"
    />
  );
};
