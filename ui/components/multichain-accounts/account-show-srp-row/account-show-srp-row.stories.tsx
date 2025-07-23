import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { MOCK_ACCOUNT_EOA } from '../../../../test/data/mock-accounts';
import { AccountShowSrpRow } from './account-show-srp-row';

const middleware = [thunk];
const mockStore = configureMockStore(middleware);

const createMockState = (
  seedPhraseBackedUp = true,
  firstTimeFlowType = 'import',
) => ({
  metamask: {
    seedPhraseBackedUp,
    firstTimeFlowType,
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
  title: 'Components/MultichainAccounts/AccountShowSrpRow',
  component: AccountShowSrpRow,
  parameters: {
    docs: {
      description: {
        component:
          'A component that displays a Secret Recovery Phrase row with backup reminder functionality.',
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
} as Meta<typeof AccountShowSrpRow>;

const Template: StoryFn<typeof AccountShowSrpRow> = (args) => (
  <AccountShowSrpRow {...args} />
);

export const Default = Template.bind({});
Default.args = {
  account: {
    ...MOCK_ACCOUNT_EOA,
    options: {
      ...MOCK_ACCOUNT_EOA.options,
      entropySource: 'mock-hd-keyring-id',
    },
  },
};
Default.storyName = 'Default (Seed Phrase Backed Up)';

export const WithBackupReminder = Template.bind({});
WithBackupReminder.args = {
  account: {
    ...MOCK_ACCOUNT_EOA,
    options: {
      ...MOCK_ACCOUNT_EOA.options,
      entropySource: 'mock-hd-keyring-id',
    },
  },
};
WithBackupReminder.decorators = [
  (Story: StoryFn) => (
    <Provider store={mockStore(createMockState(false, 'create'))}>
      <MemoryRouter>
        <div style={{ width: '360px', margin: '0 auto', padding: '20px' }}>
          <Story />
        </div>
      </MemoryRouter>
    </Provider>
  ),
];
WithBackupReminder.storyName = 'With Backup Reminder';
