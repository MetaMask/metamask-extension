import React from 'react';
import testData from '../../../../../.storybook/test-data';
import CustomContentSearch from './custom-content-search';

export default {
  title: 'Pages/Settings/NetworksTab/CustomContentSearch',

  argTypes: {
    error: {
      control: 'text',
    },
    searchQueryInput: {
      control: 'text',
    },
    onSearch: {
      action: 'onSearch',
    },
  },
};

export const CustomContentSearchComponent = (args) => {
  return <CustomContentSearch {...args} networksList={testData.networkList} />;
};
