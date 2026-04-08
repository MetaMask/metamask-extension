import React from 'react';
import { SettingItemConfig } from '../types';
import { SettingsTab, createToggleItem } from '../shared';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import { getPreferences } from '../../../selectors';
import {
  setUseMultiAccountBalanceChecker,
  setSkipDeepLinkInterstitial,
} from '../../../store/actions';
import type { MetaMaskReduxState } from '../../../store/store';
import { PRIVACY_ITEMS } from '../search-config';
import { ThirdPartyApisItem } from './third-party-apis-item';
import { BasicFunctionalityToggleItem } from './basic-functionality-item';
import { MetametricsToggleItem } from './metametrics-item';
import { DataCollectionToggleItem } from './data-collection-item';
import { DeleteMetametricsDataItem } from './delete-metametrics-data-item';
import { DownloadStateLogsItem } from './download-state-logs-item';
import { ExportYourDataItem } from './export-your-data-item';

const BatchAccountBalanceRequestsToggleItem = createToggleItem({
  name: 'BatchAccountBalanceRequestsToggleItem',
  titleKey: PRIVACY_ITEMS['batch-account-balance-requests'],
  descriptionKey: 'useMultiAccountBalanceCheckerSettingDescriptionV2',
  selector: (state: MetaMaskReduxState) =>
    state.metamask.useMultiAccountBalanceChecker,
  action: setUseMultiAccountBalanceChecker,
  dataTestId: 'batch-account-balance-requests-toggle',
  trackEvent: {
    event: MetaMetricsEventName.SettingsUpdated,
    properties: (newValue) => ({
      // eslint-disable-next-line @typescript-eslint/naming-convention
      use_multi_account_balance_checker: newValue,
    }),
  },
});

const SkipLinkConfirmationToggleItem = createToggleItem({
  name: 'SkipLinkConfirmationToggleItem',
  titleKey: PRIVACY_ITEMS['skip-link-confirmation'],
  descriptionKey: 'skipLinkConfirmationScreensDescription',
  selector: (state: MetaMaskReduxState) =>
    Boolean(getPreferences(state).skipDeepLinkInterstitial),
  action: setSkipDeepLinkInterstitial,
  dataTestId: 'skip-link-confirmation-toggle',
  trackEvent: {
    event: MetaMetricsEventName.SettingsUpdated,
    properties: (newValue) => ({
      // eslint-disable-next-line @typescript-eslint/naming-convention
      skip_deep_link_interstitial: newValue,
    }),
  },
});

/** Registry of setting items for the Privacy page. Add new items here */
const PRIVACY_SETTING_ITEMS: SettingItemConfig[] = [
  { id: 'basic-functionality', component: BasicFunctionalityToggleItem },
  { id: 'third-party-apis', component: ThirdPartyApisItem },
  {
    id: 'batch-account-balance-requests',
    component: BatchAccountBalanceRequestsToggleItem,
  },
  { id: 'skip-link-confirmation', component: SkipLinkConfirmationToggleItem },
  {
    id: 'metametrics',
    component: MetametricsToggleItem,
    hasDividerBefore: true,
  },
  { id: 'data-collection', component: DataCollectionToggleItem },
  { id: 'delete-metametrics-data', component: DeleteMetametricsDataItem },
  {
    id: 'download-state-logs',
    component: DownloadStateLogsItem,
    hasDividerBefore: true,
  },
  {
    id: 'export-your-data',
    component: ExportYourDataItem,
  },
];

const PrivacyTab = () => <SettingsTab items={PRIVACY_SETTING_ITEMS} />;

export default PrivacyTab;
