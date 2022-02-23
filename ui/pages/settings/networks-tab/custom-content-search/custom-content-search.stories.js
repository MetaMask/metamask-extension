import React from 'react';
import CustomContentSearch from './custom-content-search';

export default {
  title: 'Pages/Settings/NetworksTab/CustomContentSearch',
  id: __filename,
};

export const CustomContentSearchComponent = () => {
  return <CustomContentSearch onSearch networksList />;
};
