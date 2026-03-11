import React from 'react';
import { Text, TextColor, TextVariant } from '@metamask/design-system-react';
import { SettingItemConfig } from '../types';
import { SettingsTab, createToggleItem } from '../shared';
import { DisplayNftMediaToggleItem } from '../shared/display-nft-media-item';
import { AutodetectNftsToggleItem } from '../shared/autodetect-nfts-item';
import {
  setUse4ByteResolution,
  setUseAddressBarEnsResolution,
} from '../../../store/actions';
import type { MetaMaskReduxState } from '../../../store/store';
import { IpfsGatewayItem } from './ipfs-gateway-item';

const ShowENSDomainsToggleItem = createToggleItem({
  name: 'ShowENSDomainsToggleItem',
  titleKey: 'ensDomainsSettingTitle',
  formatDescription: (t) => (
    <>
      <Text color={TextColor.TextAlternative} variant={TextVariant.BodyMd}>
        {t('ensDomainsSettingDescriptionIntroduction')}
      </Text>
      <ul className="list-disc pl-6">
        <li>
          <Text color={TextColor.TextAlternative} variant={TextVariant.BodyMd}>
            {t('ensDomainsSettingDescriptionPart1')}
          </Text>
        </li>
        <li>
          <Text color={TextColor.TextAlternative} variant={TextVariant.BodyMd}>
            {t('ensDomainsSettingDescriptionPart2')}
          </Text>
        </li>
      </ul>
      <Text color={TextColor.TextAlternative} variant={TextVariant.BodyMd}>
        {t('ensDomainsSettingDescriptionOutroduction')}
      </Text>
    </>
  ),
  selector: (state: MetaMaskReduxState) =>
    state.metamask.useAddressBarEnsResolution,
  action: setUseAddressBarEnsResolution,
  dataTestId: 'ens-domains-toggle',
});

const MakeSmartContractsEasierToggleItem = createToggleItem({
  name: 'MakeSmartContractsEasierToggleItem',
  titleKey: 'makeSmartContractsEasier',
  descriptionKey: 'makeSmartContractsEasierDescription',
  selector: (state: MetaMaskReduxState) => state.metamask.use4ByteResolution,
  action: setUse4ByteResolution,
  dataTestId: 'make-smart-contracts-easier-toggle',
});

/** Registry of setting items for the Third-party APIs sub-page */
const THIRD_PARTY_APIS_ITEMS: SettingItemConfig[] = [
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
];

const ThirdPartyApisSubPage = () => (
  <SettingsTab items={THIRD_PARTY_APIS_ITEMS} />
);

export default ThirdPartyApisSubPage;
