import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { SettingItemConfig } from '../types';
import { SettingsTab, createToggleItem } from '../shared';
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
import { PRIVACY_ROUTE } from '../../../helpers/constants/routes';
import { getIsBasicFunctionalityConsolidationEnabled } from '../../../selectors/multichain/feature-flags';
import { THIRD_PARTY_API_ITEMS } from '../search-config';

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
  trackEventProperty: 'use_address_bar_ens_resolution',
});

const MakeSmartContractsEasierToggleItem = createToggleItem({
  name: 'MakeSmartContractsEasierToggleItem',
  titleKey: THIRD_PARTY_API_ITEMS['make-smart-contracts-easier'],
  descriptionKey: 'makeSmartContractsEasierDescription',
  selector: (state: MetaMaskReduxState) => state.metamask.use4ByteResolution,
  action: setUse4ByteResolution,
  dataTestId: 'make-smart-contracts-easier-toggle',
  trackEventProperty: 'use_4byte_resolution',
});

const ProposedNicknamesToggleItem = createToggleItem({
  name: 'ProposedNicknamesToggleItem',
  titleKey: THIRD_PARTY_API_ITEMS['proposed-nicknames'],
  descriptionKey: 'externalNameSourcesSettingDescriptionV2',
  selector: (state: MetaMaskReduxState) =>
    state.metamask.useExternalNameSources,
  action: setUseExternalNameSources,
  dataTestId: 'proposed-nicknames-toggle',
  trackEventProperty: 'use_external_name_sources',
});

/** Registry of setting items for the Third-party APIs sub-page */
const THIRD_PARTY_APIS_ITEMS: SettingItemConfig[] = [
  { id: 'network-details-check', component: NetworkDetailsCheckToggleItem },
  { id: 'show-ens-domains', component: ShowENSDomainsToggleItem },
  {
    id: 'make-smart-contracts-easier',
    component: MakeSmartContractsEasierToggleItem,
  },
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
  const isBasicFunctionalityConsolidationEnabled = useSelector(
    getIsBasicFunctionalityConsolidationEnabled,
  );

  if (isBasicFunctionalityConsolidationEnabled) {
    return <Navigate to={PRIVACY_ROUTE} replace />;
  }

  return (
    <SettingsTab
      subHeader={t('thirdPartyApisDescription')}
      items={THIRD_PARTY_APIS_ITEMS}
    />
  );
};

export default ThirdPartyApisSubPage;
