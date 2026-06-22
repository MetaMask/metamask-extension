import React from 'react';
/* eslint-disable import-x/no-restricted-paths -- TODO(ADR-0021): route-isolation backlog */
import { SettingItemConfig } from '../../settings/types';
import { SettingsTab } from '../../settings/shared';
import { BasicFunctionalityToggleItem } from '../../settings/privacy-tab/basic-functionality-item';
import { BatchAccountBalanceRequestsToggleItem } from '../../settings/privacy-tab/privacy-tab';
import {
  NetworkDetailsCheckToggleItem,
  ShowENSDomainsToggleItem,
  MakeSmartContractsEasierToggleItem,
  ProposedNicknamesToggleItem,
} from '../../settings/privacy-tab/third-party-apis-sub-page';
import { IpfsGatewayItem } from '../../settings/privacy-tab/ipfs-gateway-item';
import { DisplayNftMediaToggleItem } from '../../settings/shared/display-nft-media-item';
import { AutodetectNftsToggleItem } from '../../settings/shared/autodetect-nfts-item';
/* eslint-enable import-x/no-restricted-paths */

const OnboardingBasicFunctionalityItem = () => (
  <BasicFunctionalityToggleItem isOnboarding />
);

const ONBOARDING_PRIVACY_ITEMS: SettingItemConfig[] = [
  { id: 'basic-functionality', component: OnboardingBasicFunctionalityItem },
  {
    id: 'batch-account-balance-requests',
    component: BatchAccountBalanceRequestsToggleItem,
  },
  { id: 'network-details-check', component: NetworkDetailsCheckToggleItem },
  { id: 'show-ens-domains', component: ShowENSDomainsToggleItem },
  {
    id: 'make-smart-contracts-easier',
    component: MakeSmartContractsEasierToggleItem,
  },
  { id: 'ipfs-gateway', component: IpfsGatewayItem },
  {
    id: 'display-nft-media',
    component: DisplayNftMediaToggleItem,
    hasDividerBefore: true,
  },
  { id: 'autodetect-nfts', component: AutodetectNftsToggleItem },
  {
    id: 'proposed-nicknames',
    component: ProposedNicknamesToggleItem,
    hasDividerBefore: true,
  },
];

const OnboardingPrivacySubPage = () => (
  <SettingsTab items={ONBOARDING_PRIVACY_ITEMS} />
);

export default OnboardingPrivacySubPage;
