import React from 'react';
import { CHAIN_IDS } from '@metamask/transaction-controller';
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
  return (
    <TokenSearch
      {...args}
      tokenList={testData.metamask.tokensChainsCache}
      networkFilter={{
        [CHAIN_IDS.MAINNET]: true,
      }}
      setSearchResults={() => ({})}
    />
  );
};

DefaultStory.storyName = 'Default';
