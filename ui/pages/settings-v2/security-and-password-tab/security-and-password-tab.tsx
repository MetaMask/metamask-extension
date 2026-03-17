import React from 'react';
import { SettingItemConfig } from '../types';
import { SettingsTab, createToggleItem } from '../shared';
import { getUsePhishDetect } from '../../../selectors';
import { setUsePhishDetect } from '../../../store/actions';
import ManageWalletRecoveryItem from './manage-wallet-recovery-item';
import PasswordItem from './password-item';
import AutoLockItem from './auto-lock-item';

const PhishingDetectionItem = createToggleItem({
  name: 'PhishingDetectionItem',
  titleKey: 'usePhishingDetection',
  descriptionKey: 'usePhishingDetectionDescription',
  selector: (state) => Boolean(getUsePhishDetect(state)),
  action: setUsePhishDetect,
  dataTestId: 'security-phishing-detection-toggle',
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
