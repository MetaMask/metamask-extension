import React from 'react';
import { SettingItemConfig } from '../types';
import { SettingsTab, createToggleItem } from '../shared';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import { DisplayNftMediaToggleItem } from '../shared/display-nft-media-item';
import { AutodetectNftsToggleItem } from '../shared/autodetect-nfts-item';
import {
  setUse4ByteResolution,
  setUseAddressBarEnsResolution,
  setUseExternalNameSources,
  setUseSafeChainsListValidation,
} from '../../../store/actions';
import type { MetaMaskReduxState } from '../../../store/store';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { THIRD_PARTY_API_ITEMS } from '../search-config';
import { IpfsGatewayItem } from './ipfs-gateway-item';

const NetworkDetailsCheckToggleItem = createToggleItem({
  name: 'NetworkDetailsCheckToggleItem',
  titleKey: THIRD_PARTY_API_ITEMS['network-details-check'],
  formatDescription: (t) =>
    t('useSafeChainsListValidationDescriptionV2', [
      <b key="network-details-website">
        {t('useSafeChainsListValidationWebsite')}
      </b>,
    ]),
  selector: (state: MetaMaskReduxState) =>
    state.metamask.useSafeChainsListValidation,
  action: setUseSafeChainsListValidation,
  dataTestId: 'network-details-check-toggle',
  containerDataTestId: 'useSafeChainsListValidation',
});

const ShowENSDomainsToggleItem = createToggleItem({
  name: 'ShowENSDomainsToggleItem',
  titleKey: THIRD_PARTY_API_ITEMS['show-ens-domains'],
  formatDescription: (t) => (
    <>
      {t('ensDomainsSettingDescriptionIntroduction')}
      <ul className="list-disc pl-6 my-1">
        <li>{t('ensDomainsSettingDescriptionPart1')}</li>
        <li>{t('ensDomainsSettingDescriptionPart2')}</li>
      </ul>
      {t('ensDomainsSettingDescriptionOutroduction')}
    </>
  ),
  selector: (state: MetaMaskReduxState) =>
    state.metamask.useAddressBarEnsResolution,
  action: setUseAddressBarEnsResolution,
  dataTestId: 'ens-domains-toggle',
  containerDataTestId: 'ipfs-gateway-resolution-container',
});

const MakeSmartContractsEasierToggleItem = createToggleItem({
  name: 'MakeSmartContractsEasierToggleItem',
  titleKey: THIRD_PARTY_API_ITEMS['make-smart-contracts-easier'],
  descriptionKey: 'makeSmartContractsEasierDescription',
  selector: (state: MetaMaskReduxState) => state.metamask.use4ByteResolution,
  action: setUse4ByteResolution,
  dataTestId: 'make-smart-contracts-easier-toggle',
});

const ProposedNicknamesToggleItem = createToggleItem({
  name: 'ProposedNicknamesToggleItem',
  titleKey: THIRD_PARTY_API_ITEMS['proposed-nicknames'],
  descriptionKey: 'externalNameSourcesSettingDescriptionV2',
  selector: (state: MetaMaskReduxState) =>
    state.metamask.useExternalNameSources,
  action: setUseExternalNameSources,
  dataTestId: 'proposed-nicknames-toggle',
  trackEvent: {
    event: MetaMetricsEventName.SettingsUpdated,
    properties: (newValue) => ({
      // eslint-disable-next-line @typescript-eslint/naming-convention
      use_external_name_sources: newValue,
    }),
  },
});

/** Registry of setting items for the Third-party APIs sub-page */
const THIRD_PARTY_APIS_ITEMS: SettingItemConfig[] = [
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

const ThirdPartyApisSubPage = () => {
  const t = useI18nContext();
  return (
    <SettingsTab
      subHeader={t('thirdPartyApisDescription')}
      items={THIRD_PARTY_APIS_ITEMS}
    />
  );
};

export default ThirdPartyApisSubPage;
