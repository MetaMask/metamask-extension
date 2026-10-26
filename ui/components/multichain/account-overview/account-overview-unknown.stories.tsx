import React from 'react';
import { AccountOverviewUnknown } from './account-overview-unknown';
import { AccountOverviewCommonProps } from './common';
import { createMockRouteMessenger } from '../../../../test/lib/mock-route-messenger';
import { RouteMessengerContext } from '../../../contexts/route-messenger';

const routeMessenger = createMockRouteMessenger();

export default {
  title: 'Components/Multichain/AccountOverviewUnknown',
  component: AccountOverviewUnknown,
  decorators: [
    (Story: () => JSX.Element) => (
      <RouteMessengerContext.Provider value={routeMessenger}>
        <Story />
      </RouteMessengerContext.Provider>
    ),
  ],
  parameters: {
    initialEntries: ['/'],
    path: '*',
  },
};

export const DefaultStory = (
  args: JSX.IntrinsicAttributes & AccountOverviewCommonProps,
) => <AccountOverviewUnknown {...args} />;
