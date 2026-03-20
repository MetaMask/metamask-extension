import React from 'react';
import { SettingItemConfig } from '../types';
import { SettingsTab, createToggleItem } from '../shared';
import { getPreferences } from '../../../selectors';
import {
  setUseMultiAccountBalanceChecker,
  setSkipDeepLinkInterstitial,
} from '../../../store/actions';
import type { MetaMaskReduxState } from '../../../store/store';
import { ThirdPartyApisItem } from './third-party-apis-item';
import { BasicFunctionalityToggleItem } from './basic-functionality-item';
import { MetametricsToggleItem } from './metametrics-item';
import { DataCollectionToggleItem } from './data-collection-item';
import { DeleteMetametricsDataItem } from './delete-metametrics-data-item';
import { DownloadStateLogsItem } from './download-state-logs-item';

const BatchAccountBalanceRequestsToggleItem = createToggleItem({
  name: 'BatchAccountBalanceRequestsToggleItem',
  titleKey: 'useMultiAccountBalanceChecker',
  descriptionKey: 'useMultiAccountBalanceCheckerSettingDescriptionV2',
  selector: (state: MetaMaskReduxState) =>
    state.metamask.useMultiAccountBalanceChecker,
  action: setUseMultiAccountBalanceChecker,
  dataTestId: 'batch-account-balance-requests-toggle',
});

const SkipLinkConfirmationToggleItem = createToggleItem({
  name: 'SkipLinkConfirmationToggleItem',
  titleKey: 'skipLinkConfirmationScreens',
  descriptionKey: 'skipLinkConfirmationScreensDescription',
  selector: (state: MetaMaskReduxState) =>
    Boolean(getPreferences(state).skipDeepLinkInterstitial),
  action: setSkipDeepLinkInterstitial,
  dataTestId: 'skip-link-confirmation-toggle',
});

/** Registry of setting items for the Privacy page. Add new items here */
export const PRIVACY_SETTING_ITEMS: SettingItemConfig[] = [
  { id: 'basic-functionality', titleKey: 'basicConfigurationLabel', component: BasicFunctionalityToggleItem },
  { id: 'third-party-apis', titleKey: 'thirdPartyApis', component: ThirdPartyApisItem },
  {
    id: 'batch-account-balance-requests',
    titleKey: 'useMultiAccountBalanceChecker',
    component: BatchAccountBalanceRequestsToggleItem,
  },
  { id: 'skip-link-confirmation', titleKey: 'skipLinkConfirmationScreens', component: SkipLinkConfirmationToggleItem },
  {
    id: 'metametrics',
    titleKey: 'participateInMetaMetrics',
    component: MetametricsToggleItem,
    hasDividerBefore: true,
  },
  { id: 'data-collection', titleKey: 'dataCollectionForMarketing', component: DataCollectionToggleItem },
  { id: 'delete-metametrics-data', titleKey: 'deleteMetaMetricsData', component: DeleteMetametricsDataItem },
  {
    id: 'download-state-logs',
    titleKey: 'downloadStateLogs',
    component: DownloadStateLogsItem,
    hasDividerBefore: true,
  },
];

const PrivacyTab = () => <SettingsTab items={PRIVACY_SETTING_ITEMS} />;

export default PrivacyTab;
