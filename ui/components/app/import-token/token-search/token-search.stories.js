import React from 'react';
import testData from '../../../../../.storybook/test-data';
import TokenSearch from './token-search.component';

export default {
  title: 'Components/App/ImportToken/TokenSearch',

  argTypes: {
    error: {
      control: 'text',
    },
    onSearch: {
      action: 'onSearch',
    },
  },
};

export const DefaultStory = (args) => {
  return <TokenSearch {...args} tokenList={testData.metamask.tokenList} />;
};

DefaultStory.storyName = 'Default';
