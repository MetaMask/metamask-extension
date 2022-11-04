import React from 'react';
import SettingsSearch from './settings-search';

export default {
  title: 'Pages/Settings/SettingsSearch',
  id: __filename,
};

export const SettingsSearchComponent = () => {
  return <SettingsSearch onSearch settingsRoutesList />;
};
