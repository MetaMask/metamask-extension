import React from 'react';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import { SMART_TRANSACTIONS_LEARN_MORE_URL } from '../../../../shared/constants/smartTransactions';
import {
  SECURITY_ALERTS_LEARN_MORE_LINK,
  TRANSACTION_SIMULATIONS_LEARN_MORE_LINK,
} from '../../../../shared/lib/ui-utils';
import { getSmartTransactionsPreferenceEnabled } from '../../../../shared/lib/selectors/smart-transactions';
import { SettingItemConfig } from '../types';
import {
  SettingsTab,
  createToggleItem,
  createDescriptionWithLearnMore,
} from '../shared';
import {
  getIsSecurityAlertsEnabled,
  getPreferences,
  getUseExternalNameSources,
} from '../../../selectors';
import { getIsActiveShieldSubscription } from '../../../selectors/subscription';
import {
  setDismissSmartAccountSuggestionEnabled,
  setFeatureFlag,
  setSecurityAlertsEnabled,
  setSmartTransactionsPreferenceEnabled,
  setUseExternalNameSources,
  setUseTransactionSimulations,
} from '../../../store/actions';
import type { MetaMaskReduxState } from '../../../store/store';
import { TRANSACTION_ITEMS } from '../search-config';

const selectIsDisabledByShieldSubscription = (state: MetaMaskReduxState) =>
  getIsActiveShieldSubscription(
    state as unknown as Parameters<typeof getIsActiveShieldSubscription>[0],
  );

const TransactionSimulationsItem = createToggleItem({
  name: 'TransactionSimulationsItem',
  titleKey: TRANSACTION_ITEMS['estimate-balance-changes'],
  formatDescription: createDescriptionWithLearnMore(
    'simulationsSettingDescriptionV2',
    TRANSACTION_SIMULATIONS_LEARN_MORE_LINK,
  ),
  selector: (state: MetaMaskReduxState) =>
    Boolean(state.metamask?.useTransactionSimulations),
  action: setUseTransactionSimulations,
  dataTestId: 'transactions-simulations-toggle',
  disabledSelector: selectIsDisabledByShieldSubscription,
  trackEvent: {
    event: MetaMetricsEventName.SettingsUpdated,
    properties: (newValue) => ({
      // eslint-disable-next-line @typescript-eslint/naming-convention
      use_transaction_simulations: newValue,
    }),
  },
});

const SecurityAlertsItem = createToggleItem({
  name: 'SecurityAlertsItem',
  titleKey: TRANSACTION_ITEMS['security-alerts'],
  formatDescription: createDescriptionWithLearnMore(
    'securityAlertsDescriptionV2',
    SECURITY_ALERTS_LEARN_MORE_LINK,
  ),
  selector: getIsSecurityAlertsEnabled,
  action: setSecurityAlertsEnabled,
  dataTestId: 'transactions-security-alerts-toggle',
  containerDataTestId: 'securityAlert',
  disabledSelector: selectIsDisabledByShieldSubscription,
  trackEvent: {
    event: MetaMetricsEventName.SettingsUpdated,
    properties: (newValue) => ({
      // Analytics property name required by backend
      // eslint-disable-next-line @typescript-eslint/naming-convention
      blockaid_alerts_enabled: newValue,
    }),
  },
});

const SmartTransactionsItem = createToggleItem({
  name: 'SmartTransactionsItem',
  titleKey: TRANSACTION_ITEMS['smart-transactions'],
  formatDescription: createDescriptionWithLearnMore(
    'stxOptInDescriptionV2',
    SMART_TRANSACTIONS_LEARN_MORE_URL,
  ),
  selector: getSmartTransactionsPreferenceEnabled,
  action: setSmartTransactionsPreferenceEnabled,
  dataTestId: 'transactions-smart-transactions-toggle',
});

const SmartAccountRequestsFromDappsItem = createToggleItem({
  name: 'SmartAccountRequestsFromDappsItem',
  titleKey: TRANSACTION_ITEMS['smart-account-requests-from-dapps'],
  descriptionKey: 'smartAccountRequestsFromDappsDescription',
  selector: (state: MetaMaskReduxState) =>
    !getPreferences(state)?.dismissSmartAccountSuggestionEnabled,
  action: (value: boolean) => setDismissSmartAccountSuggestionEnabled(!value),
  dataTestId: 'transactions-smart-account-requests-toggle',
});

const ProposedNicknamesItem = createToggleItem({
  name: 'ProposedNicknamesItem',
  titleKey: TRANSACTION_ITEMS['proposed-nicknames'],
  descriptionKey: 'externalNameSourcesSettingDescriptionV2',
  selector: (state: MetaMaskReduxState) =>
    Boolean(getUseExternalNameSources(state)),
  action: setUseExternalNameSources,
  dataTestId: 'transactions-proposed-nicknames-toggle',
  trackEvent: {
    event: MetaMetricsEventName.SettingsUpdated,
    properties: (newValue) => ({
      // eslint-disable-next-line @typescript-eslint/naming-convention
      use_external_name_sources: newValue,
    }),
  },
});

const ShowHexDataItem = createToggleItem({
  name: 'ShowHexDataItem',
  titleKey: TRANSACTION_ITEMS['show-hex-data'],
  descriptionKey: 'showHexDataDescription',
  selector: (state: MetaMaskReduxState) =>
    Boolean(state.metamask?.featureFlags?.sendHexData),
  action: (value: boolean) => setFeatureFlag('sendHexData', value, ''),
  dataTestId: 'transactions-show-hex-data-toggle',
  containerDataTestId: 'transactions-settings-hex-data-toggle',
  trackEvent: {
    event: MetaMetricsEventName.SettingsUpdated,
    properties: (newValue) => ({
      // eslint-disable-next-line @typescript-eslint/naming-convention
      send_hex_data: newValue,
    }),
  },
});

const TRANSACTION_SETTING_ITEMS: SettingItemConfig[] = [
  { id: 'estimate-balance-changes', component: TransactionSimulationsItem },
  { id: 'security-alerts', component: SecurityAlertsItem },
  { id: 'smart-transactions', component: SmartTransactionsItem },
  {
    id: 'smart-account-requests-from-dapps',
    component: SmartAccountRequestsFromDappsItem,
  },
  { id: 'proposed-nicknames', component: ProposedNicknamesItem },
  { id: 'show-hex-data', component: ShowHexDataItem, hasDividerBefore: true },
];

const TransactionsTab = () => <SettingsTab items={TRANSACTION_SETTING_ITEMS} />;

export default TransactionsTab;
