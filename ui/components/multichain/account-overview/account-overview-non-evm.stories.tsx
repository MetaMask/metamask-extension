import React from 'react';
import { AccountOverviewNonEvm } from './account-overview-non-evm';
import { AccountOverviewCommonProps } from './common';
import { createMockRouteMessenger } from '../../../../test/lib/mock-route-messenger';
import { RouteMessengerContext } from '../../../contexts/route-messenger';
import {
  BtcAccountType,
  SolAccountType,
  TrxAccountType,
} from '@metamask/keyring-api';

const routeMessenger = createMockRouteMessenger();

export default {
  title: 'Components/Multichain/AccountOverviewNonEvm',
  component: AccountOverviewNonEvm,
  decorators: [
    (Story: () => JSX.Element) => (
      <RouteMessengerContext.Provider value={routeMessenger}>
        <Story />
      </RouteMessengerContext.Provider>
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
