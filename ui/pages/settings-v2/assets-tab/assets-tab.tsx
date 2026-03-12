import React from 'react';
import { SettingItemConfig } from '../types';
import { SettingsTab, createToggleItem } from '../shared';
import {
  getUseTokenDetection,
  getShouldHideZeroBalanceTokens,
  getShowNativeTokenAsMainBalance,
} from '../../../selectors';
import {
  setUseTokenDetection,
  setHideZeroBalanceTokens,
  setShowNativeTokenAsMainBalancePreference,
} from '../../../store/actions';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import { DisplayNftMediaToggleItem } from '../shared/display-nft-media-item';
import { AutodetectNftsToggleItem } from '../shared/autodetect-nfts-item';
import { LocalCurrencyItem } from './local-currency-item';

const ShowNetworkTokenToggleItem = createToggleItem({
  name: 'ShowNetworkTokenToggleItem',
  titleKey: 'showNativeTokenAsMainBalance',
  selector: getShowNativeTokenAsMainBalance,
  action: setShowNativeTokenAsMainBalancePreference,
  dataTestId: 'show-native-token-as-main-balance',
  trackEvent: {
    event: MetaMetricsEventName.SettingsUpdated,
    properties: (newValue) => ({
      // eslint-disable-next-line @typescript-eslint/naming-convention
      show_native_token_as_main_balance: newValue,
    }),
  },
});

const HideZeroBalanceTokensToggleItem = createToggleItem({
  name: 'HideZeroBalanceTokensToggleItem',
  titleKey: 'hideZeroBalanceTokens',
  selector: getShouldHideZeroBalanceTokens,
  action: setHideZeroBalanceTokens,
  dataTestId: 'toggle-zero-balance-button',
});

const AutodetectTokensToggleItem = createToggleItem({
  name: 'AutodetectTokensToggleItem',
  titleKey: 'autoDetectTokens',
  descriptionKey: 'autoDetectTokensDescriptionV2',
  selector: getUseTokenDetection,
  action: setUseTokenDetection,
  dataTestId: 'autodetect-tokens',
});

/** Registry of setting items for the Assets page. Add new items here */
const ASSET_SETTING_ITEMS: SettingItemConfig[] = [
  { id: 'local-currency', component: LocalCurrencyItem },
  { id: 'show-network-token', component: ShowNetworkTokenToggleItem },
  {
    id: 'hide-zero-balance-tokens',
    component: HideZeroBalanceTokensToggleItem,
    hasDividerBefore: true,
  },
  {
    id: 'display-nft-media',
    component: DisplayNftMediaToggleItem,
    hasDividerBefore: true,
  },
  { id: 'autodetect-nfts', component: AutodetectNftsToggleItem },
  { id: 'autodetect-tokens', component: AutodetectTokensToggleItem },
];

const AssetsTab = () => <SettingsTab items={ASSET_SETTING_ITEMS} />;

export default AssetsTab;
