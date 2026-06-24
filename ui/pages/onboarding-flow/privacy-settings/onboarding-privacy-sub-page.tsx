import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { getIsSocialLoginFlow } from '../../../selectors';
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
import { MetametricsToggleItem } from '../../settings/privacy-tab/metametrics-item';
import { DeleteMetametricsDataItem } from '../../settings/privacy-tab/delete-metametrics-data-item';
import { DisplayNftMediaToggleItem } from '../../settings/shared/display-nft-media-item';
import { AutodetectNftsToggleItem } from '../../settings/shared/autodetect-nfts-item';
/* eslint-enable import-x/no-restricted-paths */

const ONBOARDING_PRIVACY_ITEMS: SettingItemConfig[] = [
  {
    id: 'basic-functionality',
    component: BasicFunctionalityToggleItem,
    isOnboarding: true,
  },
  {
    id: 'batch-account-balance-requests',
    component: BatchAccountBalanceRequestsToggleItem,
    isOnboarding: true,
  },
  {
    id: 'network-details-check',
    component: NetworkDetailsCheckToggleItem,
    isOnboarding: true,
  },
  {
    id: 'show-ens-domains',
    component: ShowENSDomainsToggleItem,
    isOnboarding: true,
  },
  {
    id: 'make-smart-contracts-easier',
    component: MakeSmartContractsEasierToggleItem,
    isOnboarding: true,
  },
  { id: 'ipfs-gateway', component: IpfsGatewayItem, isOnboarding: true },
  {
    id: 'display-nft-media',
    component: DisplayNftMediaToggleItem,
    hasDividerBefore: true,
    isOnboarding: true,
  },
  {
    id: 'autodetect-nfts',
    component: AutodetectNftsToggleItem,
    isOnboarding: true,
  },
  {
    id: 'proposed-nicknames',
    component: ProposedNicknamesToggleItem,
    hasDividerBefore: true,
    isOnboarding: true,
  },
];

const SOCIAL_LOGIN_PRIVACY_ITEMS: SettingItemConfig[] = [
  {
    id: 'metametrics',
    component: MetametricsToggleItem,
    hasDividerBefore: true,
  },
  { id: 'delete-metametrics-data', component: DeleteMetametricsDataItem },
];

const OnboardingPrivacySubPage = () => {
  const isSocialLoginFlow = useSelector(getIsSocialLoginFlow);

  const items = useMemo(
    () =>
      isSocialLoginFlow
        ? [...ONBOARDING_PRIVACY_ITEMS, ...SOCIAL_LOGIN_PRIVACY_ITEMS]
        : ONBOARDING_PRIVACY_ITEMS,
    [isSocialLoginFlow],
  );

  return <SettingsTab items={items} />;
};

export default OnboardingPrivacySubPage;
