import React from 'react';
import { Box } from '@metamask/design-system-react';
import { LocalCurrencyItem } from './local-currency-item';
import { ShowNetworkTokenToggleItem } from './show-network-token-item';
import { HideZeroBalanceTokensToggleItem } from './hide-zero-balance-tokens-item';
import { DisplayNftMediaToggleItem } from './display-nft-media-item';
import { AutodetectNftsToggleItem } from './autodetect-nfts-item';
import { AutodetectTokensToggleItem } from './autodetect-tokens-item';

/** Registry of setting items for the Assets page. Add new items here */
const ASSET_SETTING_ITEMS: { id: string; component: React.FC }[] = [
  { id: 'local-currency', component: LocalCurrencyItem },
  { id: 'show-network-token', component: ShowNetworkTokenToggleItem },
  {
    id: 'hide-zero-balance-tokens',
    component: HideZeroBalanceTokensToggleItem,
  },
  { id: 'display-nft-media', component: DisplayNftMediaToggleItem },
  { id: 'autodetect-nfts', component: AutodetectNftsToggleItem },
  { id: 'autodetect-tokens', component: AutodetectTokensToggleItem },
];

const Assets = () => {
  return (
    <Box paddingHorizontal={4} paddingBottom={4}>
      {ASSET_SETTING_ITEMS.map(({ id, component: Component }) => (
        <Component key={id} />
      ))}
    </Box>
  );
};

export default Assets;
