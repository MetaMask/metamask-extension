import React from 'react';
import { SettingItemConfig } from '../types';
import { SettingsTab, createToggleItem } from '../shared';
import { DisplayNftMediaToggleItem } from '../shared/display-nft-media-item';
import { AutodetectNftsToggleItem } from '../shared/autodetect-nfts-item';
import { setUse4ByteResolution } from '../../../store/actions';
import type { MetaMaskReduxState } from '../../../store/store';

const MakeSmartContractsEasierItem = createToggleItem({
  name: 'MakeSmartContractsEasierItem',
  titleKey: 'makeSmartContractsEasier',
  descriptionKey: 'makeSmartContractsEasierDescription',
  selector: (state: MetaMaskReduxState) => state.metamask.use4ByteResolution,
  action: setUse4ByteResolution,
  dataTestId: 'smart-contracts-easier-toggle',
});

/** Registry of setting items for the Third-party APIs sub-page */
const THIRD_PARTY_APIS_ITEMS: SettingItemConfig[] = [
  { id: 'use-4byte-resolution', component: MakeSmartContractsEasierItem },
  {
    id: 'display-nft-media',
    component: DisplayNftMediaToggleItem,
    hasDividerBefore: true,
  },
  { id: 'autodetect-nfts', component: AutodetectNftsToggleItem },
];

const ThirdPartyApisSubPage = () => (
  <SettingsTab items={THIRD_PARTY_APIS_ITEMS} />
);

export default ThirdPartyApisSubPage;
