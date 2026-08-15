import React from 'react';
import { AccountOverviewNonEvm } from './account-overview-non-evm';
import { AccountOverviewCommonProps } from './common';
import { createMockUIMessenger } from '../../../../test/lib/mock-ui-messenger';
import { UIMessengerProvider } from '../../../contexts/ui-messenger';
import {
  BtcAccountType,
  SolAccountType,
  TrxAccountType,
} from '@metamask/keyring-api';

const uiMessenger = createMockUIMessenger();

export default {
  title: 'Components/Multichain/AccountOverviewNonEvm',
  component: AccountOverviewNonEvm,
  decorators: [
    (Story: () => JSX.Element) => (
      <UIMessengerProvider value={uiMessenger}>
        <Story />
      </UIMessengerProvider>
    ),
  ],
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
