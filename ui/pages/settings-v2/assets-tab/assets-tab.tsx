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
import { ASSET_ITEMS } from '../search-config';
import { LocalCurrencyItem } from './local-currency-item';

const ShowNetworkTokenToggleItem = createToggleItem({
  name: 'ShowNetworkTokenToggleItem',
  titleKey: ASSET_ITEMS['show-network-token'],
  selector: getShowNativeTokenAsMainBalance,
  action: setShowNativeTokenAsMainBalancePreference,
  dataTestId: 'show-native-token-as-main-balance',
  containerDataTestId: 'show-native-token-as-main-balance-toggle',
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
  titleKey: ASSET_ITEMS['hide-zero-balance-tokens'],
  selector: getShouldHideZeroBalanceTokens,
  action: setHideZeroBalanceTokens,
  dataTestId: 'toggle-zero-balance-button',
  trackEvent: {
    event: MetaMetricsEventName.SettingsUpdated,
    properties: (newValue) => ({
      // eslint-disable-next-line @typescript-eslint/naming-convention
      hide_zero_balance_tokens: newValue,
    }),
  },
});

const AutodetectTokensToggleItem = createToggleItem({
  name: 'AutodetectTokensToggleItem',
  titleKey: ASSET_ITEMS['autodetect-tokens'],
  descriptionKey: 'autoDetectTokensDescriptionV2',
  selector: getUseTokenDetection,
  action: setUseTokenDetection,
  dataTestId: 'autodetect-tokens',
  containerDataTestId: 'autodetect-tokens',
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

const AssetsTab = () => {
  return <SettingsTab items={ASSET_SETTING_ITEMS} />;
};

export default AssetsTab;
