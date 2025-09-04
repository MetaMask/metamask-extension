import React, { ReactNode } from 'react';
import { StoryObj, Meta } from '@storybook/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { SmartAccountPage } from './smart-account-page';
import mockState from '../../../../test/data/mock-state.json';

const mockStore = configureStore([]);

interface WrapperProps {
  children: ReactNode;
  initialEntries?: string[];
}

const Wrapper: React.FC<WrapperProps> = ({
  children,
  initialEntries = ['/smart-account'],
}) => (
  <MemoryRouter initialEntries={initialEntries}>
    <Route path="/smart-account/:address">{children}</Route>
  </MemoryRouter>
);

const MOCK_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678';

const meta: Meta<typeof SmartAccountPage> = {
  title: 'Pages/MultichainAccounts/SmartAccountPage',
  component: SmartAccountPage,
};

export default meta;
type Story = StoryObj<typeof SmartAccountPage>;

export const Default: Story = {
  decorators: [
    (Story) => {
      const store = mockStore(mockState);
      return (
        <Provider store={store}>
          <Wrapper
            initialEntries={[
              `/smart-account/${encodeURIComponent(MOCK_ADDRESS)}`,
            ]}
          >
            <Story />
          </Wrapper>
        </Provider>
      );
    },
  ],
};
