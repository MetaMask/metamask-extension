import type { Meta, StoryObj } from '@storybook/react';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import AddRewardsAccount from './AddRewardsAccount';

const mockAccount: InternalAccount = {
  address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
  id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
  metadata: {
    importTime: 0,
    name: 'Test Account',
    keyring: { type: 'HD Key Tree' },
  },
  options: { entropySource: '01JKAF3DSGM3AB87EM9N0K41AJ' },
  methods: [
    'personal_sign',
    'eth_signTransaction',
    'eth_signTypedData_v1',
    'eth_signTypedData_v3',
    'eth_signTypedData_v4',
  ],
  scopes: ['eip155:0'],
  type: 'eip155:eoa',
};

const meta: Meta<typeof AddRewardsAccount> = {
  title: 'Components/App/Rewards/AddRewardsAccount',
  component: AddRewardsAccount,
  args: {
    account: mockAccount,
  },
};

export default meta;
type Story = StoryObj<typeof AddRewardsAccount>;

export const DefaultStory: Story = {};
DefaultStory.storyName = 'Default';
