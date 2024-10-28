import React from 'react';
import { AccountOverviewBtc } from './account-overview-btc'
import { AccountOverviewCommonProps } from './common';

export default {
  title: 'Components/Multichain/AccountOverviewBtc',
  component: AccountOverviewBtc,
};

export const DefaultStory = (
  args: JSX.IntrinsicAttributes & AccountOverviewCommonProps
) => <AccountOverviewBtc {...args} />;
