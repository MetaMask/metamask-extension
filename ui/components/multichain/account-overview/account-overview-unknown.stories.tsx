import React from 'react';
import { AccountOverviewUnknown } from './account-overview-unknown'
import { AccountOverviewCommonProps } from './common';

export default {
  title: 'Components/Multichain/AccountOverviewUnknown',
  component: AccountOverviewUnknown,
};

export const DefaultStory = (
  args: JSX.IntrinsicAttributes & AccountOverviewCommonProps
) => <AccountOverviewUnknown {...args} />;
