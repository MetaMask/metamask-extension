import React, { ReactNode } from 'react';
import { StoryObj, Meta } from '@storybook/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route } from 'react-router-dom';
import { AccountList } from './account-list';
import mockState from '../../../../test/data/mock-state.json';
import configureStore from '../../../store/store';

const store = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

interface WrapperProps {
  children: ReactNode;
  initialEntries?: string[];
}

const Wrapper: React.FC<WrapperProps> = ({
  children,
  initialEntries = ['/accounts'],
}) => (
  <Provider store={store}>
    <MemoryRouter initialEntries={initialEntries}>
      <Route path="*">{children}</Route>
    </MemoryRouter>
  </Provider>
);

const meta: Meta<typeof AccountList> = {
  title: 'Pages/MultichainAccounts/AccountList',
  component: AccountList,
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
type Story = StoryObj<typeof AccountList>;

export const Default: Story = {};

Default.parameters = {
  docs: {
    description: {
      story:
        'Default state of the AccountList page showing various wallets and their accounts.',
    },
  },
};
