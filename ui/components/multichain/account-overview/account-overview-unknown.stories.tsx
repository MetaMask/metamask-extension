import React from 'react';
import { AccountOverviewUnknown } from './account-overview-unknown';
import { AccountOverviewCommonProps } from './common';
import { createMockUIMessenger } from '../../../../test/lib/mock-ui-messenger';
import { UIMessengerProvider } from '../../../contexts/ui-messenger';

const uiMessenger = createMockUIMessenger();

export default {
  title: 'Components/Multichain/AccountOverviewUnknown',
  component: AccountOverviewUnknown,
  decorators: [
    (Story: () => JSX.Element) => (
      <UIMessengerProvider value={uiMessenger}>
        <Story />
      </UIMessengerProvider>
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
