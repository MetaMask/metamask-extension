import React from 'react';
import { SettingItemConfig } from '../types';
import { SettingsTab, createToggleItem, createDescriptionWithLearnMore } from '../shared';
import { getShowFiatInTestnets } from '../../../selectors';
import { setShowFiatConversionOnTestnetsPreference } from '../../../store/actions';

const SHOW_CONVERSION_IN_TESTNETS_LEARN_MORE_LINK =
  "https://support.metamask.io/stay-safe/protect-yourself/tokens-and-transactions/testnet-eth-scams/";

const ShowConversionInTestnetsItem = createToggleItem({
  name: 'ShowConversionInTestnetsItem',
  titleKey: 'showFiatConversionInTestnets',
  formatDescription: createDescriptionWithLearnMore(
    'showFiatConversionInTestnetsDescriptionV2',
    SHOW_CONVERSION_IN_TESTNETS_LEARN_MORE_LINK,
  ),
  selector: getShowFiatInTestnets,
  action: setShowFiatConversionOnTestnetsPreference,
  dataTestId: 'developer-options-show-testnet-conversion-toggle',
});

/** Registry of setting items for the Developer Options page. Add new items here */
const DEVELOPER_OPTIONS_SETTING_ITEMS: SettingItemConfig[] = [
  { id: 'show-fiat-in-testnets', component: ShowConversionInTestnetsItem },
];

const DeveloperOptionsTab = () => (
  <SettingsTab items={DEVELOPER_OPTIONS_SETTING_ITEMS} />
);

export default DeveloperOptionsTab;
