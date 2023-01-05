import React from 'react';
import SettingsSearch from './settings-search';

export default {
  title: 'Pages/Settings/SettingsSearch',
};

export const SettingsSearchComponent = () => {
  return <SettingsSearch onSearch settingsRoutesList />;
};
