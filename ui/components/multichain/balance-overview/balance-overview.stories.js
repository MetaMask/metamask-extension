import React from 'react';
import { BalanceOverview } from '.';

export default {
  title: 'Components/Multichain/BalanceOverview',
  component: BalanceOverview,
};

export const DefaultStory = () => <BalanceOverview balance="14ba1e6a08a9ec" />;

DefaultStory.storyName = 'Default';
