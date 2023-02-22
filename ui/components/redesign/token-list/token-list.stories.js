import React from 'react';
import README from './README.mdx';
import { TokenList } from './token-list';

export default {
  title: 'Components/Redesign/TokenList',
  component: TokenList,
  parameters: {
    docs: {
      page: README,
    },
  },
};

export const DefaultStory = () => <TokenList />;

DefaultStory.storyName = 'Default';
