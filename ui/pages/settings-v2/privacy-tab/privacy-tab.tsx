import React from 'react';
import { SettingItemConfig } from '../types';
import { SettingsTab, createToggleItem } from '../shared';
import { getPreferences } from '../../../selectors';
import {
  setUseMultiAccountBalanceChecker,
  setSkipDeepLinkInterstitial,
} from '../../../store/actions';
import type { MetaMaskReduxState } from '../../../store/store';
import { BasicFunctionalityToggleItem } from './basic-functionality-item';
import { MetametricsToggleItem } from './metametrics-item';
import { DataCollectionToggleItem } from './data-collection-item';

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
const PRIVACY_SETTING_ITEMS: SettingItemConfig[] = [
  { id: 'basic-functionality', component: BasicFunctionalityToggleItem },
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
];

const PrivacyTab = () => <SettingsTab items={PRIVACY_SETTING_ITEMS} />;

export default PrivacyTab;
