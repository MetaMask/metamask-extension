import React from 'react';
import { SettingItemConfig } from '../types';
import { SettingsTab, createSelectItem, createToggleItem } from '../shared';
import { getPreferences, getUsePhishDetect } from '../../../selectors';
import { setUsePhishDetect } from '../../../store/actions';
import {
  AUTO_LOCK_ROUTE,
  SECURITY_PASSWORD_CHANGE_ROUTE,
} from '../../../helpers/constants/routes';
import { DEFAULT_AUTO_LOCK_TIME_LIMIT } from '../../../../shared/constants/preferences';
import ManageWalletRecoveryItem from './manage-wallet-recovery-item';
import { formatAutoLockLabel } from './auto-lock-utils';

const PhishingDetectionItem = createToggleItem({
  name: 'PhishingDetectionItem',
  titleKey: 'usePhishingDetection',
  descriptionKey: 'usePhishingDetectionDescription',
  selector: (state) => Boolean(getUsePhishDetect(state)),
  action: setUsePhishDetect,
  dataTestId: 'security-phishing-detection-toggle',
});

const PasswordItem = createSelectItem({
  name: 'PasswordItem',
  titleKey: 'password',
  valueSelector: () => '',
  route: SECURITY_PASSWORD_CHANGE_ROUTE,
});

export const AutoLockItem = createSelectItem({
  name: 'AutoLockItem',
  titleKey: 'autoLock',
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
});

const SECURITY_AND_PASSWORD_SETTING_ITEMS: SettingItemConfig[] = [
  { id: 'manage-wallet-recovery', component: ManageWalletRecoveryItem },
  { id: 'password', component: PasswordItem },
  { id: 'auto-lock', component: AutoLockItem },
  {
    id: 'phishing-detection',
    component: PhishingDetectionItem,
  },
];

const SecurityAndPasswordTab = () => (
  <SettingsTab items={SECURITY_AND_PASSWORD_SETTING_ITEMS} />
);

export default SecurityAndPasswordTab;
