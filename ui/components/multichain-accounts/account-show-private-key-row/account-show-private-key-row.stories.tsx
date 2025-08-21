import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { MOCK_ACCOUNT_EOA } from '../../../../test/data/mock-accounts';
import { AccountShowPrivateKeyRow } from './account-show-private-key-row';

const middleware = [thunk];
const mockStore = configureMockStore(middleware);

const createMockState = () => ({
  metamask: {
    seedPhraseBackedUp: true,
    keyrings: [
      {
        type: 'HD Key Tree',
        accounts: [MOCK_ACCOUNT_EOA.address],
        metadata: {
          id: 'mock-hd-keyring-id',
          name: 'HD Key Tree',
        },
      },
    ],
  },
});

export default {
  title: 'Components/MultichainAccounts/AccountShowPrivateKeyRow',
  component: AccountShowPrivateKeyRow,
  parameters: {
    docs: {
      description: {
        component: 'A component that displays a Private Key row with export functionality.',
      },
    },
    controls: { sort: 'alpha' },
  },
  argTypes: {
    account: {
      control: 'object',
      description: 'The account object containing metadata and options',
    },
  },
  decorators: [
    (Story: StoryFn) => (
      <Provider store={mockStore(createMockState())}>
        <MemoryRouter>
          <div style={{ width: '360px', margin: '0 auto', padding: '20px' }}>
            <Story />
          </div>
        </MemoryRouter>
      </Provider>
    ),
  ],
} as Meta<typeof AccountShowPrivateKeyRow>;

const Template: StoryFn<typeof AccountShowPrivateKeyRow> = (args) => (
  <AccountShowPrivateKeyRow {...args} />
);

export const Default = Template.bind({});
Default.args = {
  account: MOCK_ACCOUNT_EOA,
};
Default.storyName = 'Default (Exportable Account)';

export const HardwareAccount = Template.bind({});
HardwareAccount.args = {
  account: {
    ...MOCK_ACCOUNT_EOA,
    metadata: {
      ...MOCK_ACCOUNT_EOA.metadata,
      keyring: { type: 'Hardware' },
    },
  },
};
HardwareAccount.storyName = 'Hardware Account (Not Exportable)';

export const SnapAccount = Template.bind({});
SnapAccount.args = {
  account: {
    ...MOCK_ACCOUNT_EOA,
    metadata: {
      ...MOCK_ACCOUNT_EOA.metadata,
      keyring: { type: 'Snap' },
    },
  },
};
SnapAccount.storyName = 'Snap Account (Not Exportable)';