import React from 'react';
import { Box } from '@metamask/design-system-react';
import { LocalCurrencyItem } from './local-currency-item';
import { ShowNetworkTokenToggleItem } from './show-network-token-item';
import { HideZeroBalanceTokensToggleItem } from './hide-zero-balance-tokens-item';
import { DisplayNftMediaToggleItem } from './display-nft-media-item';
import { AutodetectNftsToggleItem } from './autodetect-nfts-item';
import { AutodetectTokensToggleItem } from './autodetect-tokens-item';

/** Registry of setting items for the Assets page. Add new items here */
const ASSET_SETTING_ITEMS: { id: string; Component: React.FC }[] = [
  { id: 'local-currency', Component: LocalCurrencyItem },
  { id: 'show-network-token', Component: ShowNetworkTokenToggleItem },
  {
    id: 'hide-zero-balance-tokens',
    Component: HideZeroBalanceTokensToggleItem,
  },
  { id: 'display-nft-media', Component: DisplayNftMediaToggleItem },
  { id: 'autodetect-nfts', Component: AutodetectNftsToggleItem },
  { id: 'autodetect-tokens', Component: AutodetectTokensToggleItem },
];

export const Assets = () => {
  return (
    <Box padding={4}>
      {ASSET_SETTING_ITEMS.map(({ id, Component }) => (
        <Component key={id} />
      ))}
    </Box>
  );
};
