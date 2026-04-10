import React from 'react';
import { SettingItemConfig } from '../types';
import { SettingsTab, createSelectItem, createToggleItem } from '../shared';
import { getPreferences, getUsePhishDetect } from '../../../selectors';
import { setUsePhishDetect } from '../../../store/actions';
import {
  AUTO_LOCK_ROUTE,
  MANAGE_WALLET_RECOVERY_V2_ROUTE,
  SECURITY_PASSWORD_CHANGE_V2_ROUTE,
} from '../../../helpers/constants/routes';
import { DEFAULT_AUTO_LOCK_TIME_LIMIT } from '../../../../shared/constants/preferences';
import { SECURITY_ITEMS } from '../search-config';
import ManageWalletRecoveryItem from './manage-wallet-recovery-item';
import { formatAutoLockLabel } from './auto-lock-utils';

const PhishingDetectionItem = createToggleItem({
  name: 'PhishingDetectionItem',
  titleKey: SECURITY_ITEMS['phishing-detection'],
  descriptionKey: 'usePhishingDetectionDescription',
  selector: (state) => Boolean(getUsePhishDetect(state)),
  action: setUsePhishDetect,
  dataTestId: 'security-phishing-detection-toggle',
});

const PasswordItem = createSelectItem({
  name: 'PasswordItem',
  titleKey: SECURITY_ITEMS.password,
  valueSelector: () => '',
  route: SECURITY_PASSWORD_CHANGE_V2_ROUTE,
  dataTestId: 'change-password-button',
});

export const AutoLockItem = createSelectItem({
  name: 'AutoLockItem',
  titleKey: SECURITY_ITEMS['auto-lock'],
  valueSelector: (state) => {
    const { autoLockTimeLimit = DEFAULT_AUTO_LOCK_TIME_LIMIT } =
      getPreferences(state);
    return String(autoLockTimeLimit);
  },
  formatValue: (autoLockTimeLimit, t) =>
    formatAutoLockLabel(
      Number(autoLockTimeLimit),
      t as (key: string, substitutions?: string[]) => string,
    ),
  route: AUTO_LOCK_ROUTE,
  dataTestId: 'auto-lock-button',
});

const SECURITY_AND_PASSWORD_SETTING_ITEMS: SettingItemConfig[] = [
  {
    id: 'manage-wallet-recovery',
    component: () => (
      <ManageWalletRecoveryItem route={MANAGE_WALLET_RECOVERY_V2_ROUTE} />
    ),
  },
  { id: 'password', component: PasswordItem },
  { id: 'auto-lock', component: AutoLockItem },
  { id: 'phishing-detection', component: PhishingDetectionItem },
];

const SecurityAndPasswordTab = () => (
  <SettingsTab items={SECURITY_AND_PASSWORD_SETTING_ITEMS} />
);

export default SecurityAndPasswordTab;
