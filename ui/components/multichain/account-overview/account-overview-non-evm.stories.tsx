import React from 'react';
import { AccountOverviewNonEvm } from './account-overview-non-evm';
import { AccountOverviewCommonProps } from './common';
import { BtcAccountType, SolAccountType } from '@metamask/keyring-api';

export default {
  title: 'Components/Multichain/AccountOverviewNonEvm',
  component: AccountOverviewNonEvm,
  args: {
    accountType: BtcAccountType.P2wpkh,
  },
};

export const DefaultStory = (
  args: JSX.IntrinsicAttributes &
    AccountOverviewCommonProps & {
      accountType: BtcAccountType.P2wpkh | SolAccountType.DataAccount;
    },
) => <AccountOverviewNonEvm {...args} />;
