import React from 'react';
import { SettingItemConfig } from '../types';
import { SettingsTab } from '../shared';
import { BasicFunctionalityToggleItem } from './basic-functionality-item';
import { BatchAccountBalanceRequestsToggleItem } from './batch-account-balance-requests-item';
import { SkipLinkConfirmationToggleItem } from './skip-link-confirmation-item';

/** Registry of setting items for the Privacy page. Add new items here */
const PRIVACY_SETTING_ITEMS: SettingItemConfig[] = [
  { id: 'basic-functionality', component: BasicFunctionalityToggleItem },
  {
    id: 'batch-account-balance-requests',
    component: BatchAccountBalanceRequestsToggleItem,
  },
  { id: 'skip-link-confirmation', component: SkipLinkConfirmationToggleItem },
];

const PrivacyTab = () => <SettingsTab items={PRIVACY_SETTING_ITEMS} />;

export default PrivacyTab;
