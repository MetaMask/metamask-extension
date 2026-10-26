import React from 'react';
import { AccountOverviewEth } from './account-overview-eth';
import { AccountOverviewCommonProps } from './common';
import { createMockRouteMessenger } from '../../../../test/lib/mock-route-messenger';
import { RouteMessengerContext } from '../../../contexts/route-messenger';

const routeMessenger = createMockRouteMessenger();

export default {
  title: 'Components/Multichain/AccountOverviewEth',
  component: AccountOverviewEth,
  decorators: [
    (Story: () => JSX.Element) => (
      <RouteMessengerContext.Provider value={routeMessenger}>
        <Story />
      </RouteMessengerContext.Provider>
    ),
  ],
};

export const DefaultStory = (
  args: JSX.IntrinsicAttributes & AccountOverviewCommonProps,
) => <AccountOverviewEth {...args} />;
