import React from 'react';
import { SettingItemConfig } from '../types';
import { SettingsTab } from '../shared';
import { LocalCurrencyItem } from './local-currency-item';
import { ShowNetworkTokenToggleItem } from './show-network-token-item';
import { HideZeroBalanceTokensToggleItem } from './hide-zero-balance-tokens-item';
import { DisplayNftMediaToggleItem } from './display-nft-media-item';
import { AutodetectNftsToggleItem } from './autodetect-nfts-item';
import { AutodetectTokensToggleItem } from './autodetect-tokens-item';

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
