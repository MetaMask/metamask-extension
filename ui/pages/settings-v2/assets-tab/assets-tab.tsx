import React from 'react';
import { Box } from '@metamask/design-system-react';
import { SettingItemConfig } from '../types';
import { Divider } from '../shared';
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

export const Assets = ({ children }: { children: SettingItemConfig[] }) => {
  return (
    <Box>
      {children.map(({ id, component: Component, hasDividerBefore }) => (
        <React.Fragment key={id}>
          {hasDividerBefore && <Divider />}
          <Component />
        </React.Fragment>
      ))}
    </Box>
  );
};

const AssetsWithList = () => <Assets>{ASSET_SETTING_ITEMS}</Assets>;

export default AssetsWithList;
