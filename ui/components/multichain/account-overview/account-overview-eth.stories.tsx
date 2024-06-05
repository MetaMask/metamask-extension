import React from 'react';
import { AccountOverviewEth } from './account-overview-eth'
import { AccountOverviewCommonOptions } from './common';

export default {
  title: 'Components/Multichain/AccountOverviewEth',
  component: AccountOverviewEth,
};

export const DefaultStory = (
  args: JSX.IntrinsicAttributes & AccountOverviewCommonOptions
) => <AccountOverviewEth {...args} />;
