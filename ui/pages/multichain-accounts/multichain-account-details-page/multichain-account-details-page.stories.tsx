import React from 'react';
import { StoryObj, Meta } from '@storybook/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route } from 'react-router-dom';
import { MultichainAccountDetailsPage } from './multichain-account-details-page';
import mockState from '../../../../test/data/mock-state.json';
import configureStore from '../../../store/store';

const store = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

interface WrapperProps {
  children: React.ReactNode;
  accountId?: string;
}

const Wrapper: React.FC<WrapperProps> = ({
  children,
  accountId = 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0',
}) => (
  <Provider store={store}>
    <MemoryRouter
      initialEntries={[
        `/multichain-account-details/${encodeURIComponent(accountId)}`,
      ]}
    >
      <Route path="/multichain-account-details/:id">{children}</Route>
    </MemoryRouter>
  </Provider>
);

const meta: Meta<typeof MultichainAccountDetailsPage> = {
  title: 'Pages/MultichainAccounts/MultichainAccountDetailsPage',
  component: MultichainAccountDetailsPage,
  decorators: [
    (Story) => (
      <Wrapper>
        <Story />
      </Wrapper>
    ),
  ],
  parameters: {
    backgrounds: {
      default: 'light',
    },
  },
};

export default meta;
type Story = StoryObj<typeof MultichainAccountDetailsPage>;

export const Default: Story = {};

Default.parameters = {
  docs: {
    description: {
      story:
        'Default state of the MultichainAccountDetailsPage showing account details for the selected account.',
    },
  },
};
