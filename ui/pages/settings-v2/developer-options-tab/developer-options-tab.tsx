import React from 'react';
import { SettingItemConfig } from '../types';
import {
  SettingsTab,
  createToggleItem,
  createDescriptionWithLearnMore,
} from '../shared';
import { TESTNET_ETH_SCAMS_LEARN_MORE_LINK } from '../../../../shared/lib/ui-utils';
import { getShowFiatInTestnets } from '../../../selectors';
import { setShowFiatConversionOnTestnetsPreference } from '../../../store/actions';
import { AutoResetAccountItem } from './auto-reset-account-item';

const ShowConversionInTestnetsItem = createToggleItem({
  name: 'ShowConversionInTestnetsItem',
  titleKey: 'showFiatConversionInTestnets',
  formatDescription: createDescriptionWithLearnMore(
    'showFiatConversionInTestnetsDescriptionV2',
    TESTNET_ETH_SCAMS_LEARN_MORE_LINK,
  ),
  selector: getShowFiatInTestnets,
  action: setShowFiatConversionOnTestnetsPreference,
  dataTestId: 'developer-options-show-testnet-conversion-toggle',
});

/** Registry of setting items for the Developer Options page. Add new items here */
const DEVELOPER_OPTIONS_SETTING_ITEMS: SettingItemConfig[] = [
  { id: 'show-fiat-in-testnets', component: ShowConversionInTestnetsItem },
  { id: 'auto-reset-account', component: AutoResetAccountItem },
];

const DeveloperOptionsTab = () => (
  <SettingsTab items={DEVELOPER_OPTIONS_SETTING_ITEMS} />
);

export default DeveloperOptionsTab;
