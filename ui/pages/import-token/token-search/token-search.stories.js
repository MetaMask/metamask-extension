import React from 'react';
import testData from '../../../../.storybook/test-data';
import TokenSearch from './token-search.component';

export default {
  title: 'Pages/ImportToken/TokenSearch',
  id: __filename,
};

export const DefaultStory = () => {
  return <TokenSearch tokenList={testData.metamask.tokenList} />;
};

DefaultStory.storyName = 'Default';
