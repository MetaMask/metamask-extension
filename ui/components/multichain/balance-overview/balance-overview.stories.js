import React from 'react';
import { BalanceOverview } from '.';

export default {
  title: 'Components/Multichain/BalanceOverview',
  component: BalanceOverview,
};

export const DefaultStory = () => <BalanceOverview balance="$29.50" />;

DefaultStory.storyName = 'Default';
