import React from 'react';
import {
  BtcAccountType,
  SolAccountType,
  TrxAccountType,
} from '@metamask/keyring-api';
import { AccountOverviewNonEvm } from './account-overview-non-evm';
import { AccountOverviewCommonProps } from './common';

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
      accountType:
        | BtcAccountType.P2wpkh
        | SolAccountType.DataAccount
        | TrxAccountType.Eoa;
    },
) => <AccountOverviewNonEvm {...args} />;
