import React from 'react';
import { SettingItemConfig } from '../types';
import { SettingsTab } from '../shared';
import { TransactionSimulationsItem } from './transaction-simulations-item';
import { SecurityAlertsItem } from './security-alerts-item';
import { SmartTransactionsItem } from './smart-transactions-item';
import { SmartAccountRequestsFromDappsItem } from './smart-account-requests-from-dapps-item';
import { ProposedNicknamesItem } from './proposed-nicknames-item';
import { ShowHexDataItem } from './show-hex-data-item';
import { CustomizeTransactionNonceItem } from './customize-transaction-nonce-item';
import { DismissSmartAccountSuggestionItem } from './dismiss-smart-account-suggestion-item';

/** Registry of setting items for the Transactions page. Add new items here */
const TRANSACTION_SETTING_ITEMS: SettingItemConfig[] = [
  { id: 'estimate-balance-changes', component: TransactionSimulationsItem },
  { id: 'security-alerts', component: SecurityAlertsItem },
  { id: 'smart-transactions', component: SmartTransactionsItem },
  {
    id: 'smart-account-requests-from-dapps',
    component: SmartAccountRequestsFromDappsItem,
  },
  { id: 'proposed-nicknames', component: ProposedNicknamesItem },
  { id: 'show-hex-data', component: ShowHexDataItem },
  {
    id: 'customize-transaction-nonce',
    component: CustomizeTransactionNonceItem,
  },
  {
    id: 'dismiss-smart-account-suggestion',
    component: DismissSmartAccountSuggestionItem,
  },
];

const TransactionsTab = () => <SettingsTab items={TRANSACTION_SETTING_ITEMS} />;

export default TransactionsTab;
