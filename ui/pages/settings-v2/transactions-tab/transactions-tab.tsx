import React from 'react';
import { SettingItemConfig } from '../types';
import { SettingsTab, createToggleItem } from '../shared';
import { getPreferences, getUseExternalNameSources } from '../../../selectors';
import {
  setFeatureFlag,
  setUseExternalNameSources,
  setSmartAccountRequestsFromDapps,
} from '../../../store/actions';
import type { MetaMaskReduxState } from '../../../store/store';
import { TransactionSimulationsItem } from './transaction-simulations-item';
import { SecurityAlertsItem } from './security-alerts-item';
import { SmartTransactionsItem } from './smart-transactions-item';

const ShowHexDataItem = createToggleItem({
  name: 'ShowHexDataItem',
  titleKey: 'showHexData',
  descriptionKey: 'showHexDataDescription',
  selector: (state: MetaMaskReduxState) =>
    Boolean(state.metamask?.featureFlags?.sendHexData),
  action: (value: boolean) => setFeatureFlag('sendHexData', value, ''),
  dataTestId: 'showHexData-toggle',
});

const ProposedNicknamesItem = createToggleItem({
  name: 'ProposedNicknamesItem',
  titleKey: 'externalNameSourcesSetting',
  descriptionKey: 'externalNameSourcesSettingDescription',
  selector: (state: MetaMaskReduxState) =>
    Boolean(getUseExternalNameSources(state)),
  action: (value: boolean) => () => {
    setUseExternalNameSources(value);
  },
  dataTestId: 'useExternalNameSources-toggle',
});

const SmartAccountRequestsFromDappsItem = createToggleItem({
  name: 'SmartAccountRequestsFromDappsItem',
  titleKey: 'smartAccountRequestsFromDapps',
  descriptionKey: 'smartAccountRequestsFromDappsDescription',
  selector: (state: MetaMaskReduxState) =>
    Boolean(getPreferences(state)?.smartAccountRequestsFromDapps),
  action: setSmartAccountRequestsFromDapps,
  dataTestId: 'settings-page-smart-account-requests-from-dapps-toggle',
});

/** Registry of setting items for the Transactions page */
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
];

const TransactionsTab = () => <SettingsTab items={TRANSACTION_SETTING_ITEMS} />;

export default TransactionsTab;
