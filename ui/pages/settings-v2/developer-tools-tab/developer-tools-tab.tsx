import React from 'react';
import { SettingItemConfig } from '../types';
import {
  SettingsTab,
  createToggleItem,
  createDescriptionWithLearnMore,
} from '../shared';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import { TESTNET_ETH_SCAMS_LEARN_MORE_LINK } from '../../../../shared/lib/ui-utils';
import { getShowFiatInTestnets } from '../../../selectors';
import { setShowFiatConversionOnTestnetsPreference } from '../../../store/actions';
import { DEVELOPER_TOOLS_ITEMS } from '../search-config';
import { DeleteActivityItem } from './delete-activity-item';

const ShowConversionInTestnetsItem = createToggleItem({
  name: 'ShowConversionInTestnetsItem',
  titleKey: DEVELOPER_TOOLS_ITEMS['show-fiat-in-testnets'],
  formatDescription: createDescriptionWithLearnMore(
    'showFiatConversionInTestnetsDescriptionV2',
    TESTNET_ETH_SCAMS_LEARN_MORE_LINK,
  ),
  selector: getShowFiatInTestnets,
  action: setShowFiatConversionOnTestnetsPreference,
  dataTestId: 'developer-options-show-testnet-conversion-toggle',
  trackEvent: {
    event: MetaMetricsEventName.SettingsUpdated,
    properties: (newValue) => ({
      // eslint-disable-next-line @typescript-eslint/naming-convention
      show_fiat_in_testnets: newValue,
    }),
  },
});

/** Registry of setting items for the Developer Options page. Add new items here */
const DEVELOPER_OPTIONS_SETTING_ITEMS: SettingItemConfig[] = [
  { id: 'show-fiat-in-testnets', component: ShowConversionInTestnetsItem },
  { id: 'delete-activity-and-nonce-data', component: DeleteActivityItem },
];

const DeveloperToolsTab = () => (
  <SettingsTab items={DEVELOPER_OPTIONS_SETTING_ITEMS} />
);

export default DeveloperToolsTab;
