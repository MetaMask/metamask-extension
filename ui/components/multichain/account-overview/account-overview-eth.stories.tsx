import React from 'react';
import { AccountOverviewEth } from './account-overview-eth';
import { AccountOverviewCommonProps } from './common';
import { createMockUIMessenger } from '../../../../test/lib/mock-ui-messenger';
import { UIMessengerProvider } from '../../../contexts/ui-messenger';

const uiMessenger = createMockUIMessenger();

export default {
  title: 'Components/Multichain/AccountOverviewEth',
  component: AccountOverviewEth,
  decorators: [
    (Story: () => JSX.Element) => (
      <UIMessengerProvider value={uiMessenger}>
        <Story />
      </UIMessengerProvider>
    ),
  ],
};

export const DefaultStory = (
  args: JSX.IntrinsicAttributes & AccountOverviewCommonProps,
) => <AccountOverviewEth {...args} />;
