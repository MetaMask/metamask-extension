import React from 'react';
import { AccountOverviewEth } from './account-overview-eth'
import { AccountOverviewCommonProps } from './common';

export default {
  title: 'Components/Multichain/AccountOverviewEth',
  component: AccountOverviewEth,
};

export const DefaultStory = (
  args: JSX.IntrinsicAttributes & AccountOverviewCommonProps
) => <AccountOverviewEth {...args} />;
