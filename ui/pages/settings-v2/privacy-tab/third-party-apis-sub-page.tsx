import React from 'react';
import { SettingItemConfig } from '../types';
import { SettingsTab } from '../shared';

/** Registry of setting items for the Third-party APIs sub-page */
const THIRD_PARTY_APIS_ITEMS: SettingItemConfig[] = [
];

const ThirdPartyApisSubPage = () => (
  <SettingsTab items={THIRD_PARTY_APIS_ITEMS} />
);

export default ThirdPartyApisSubPage;
