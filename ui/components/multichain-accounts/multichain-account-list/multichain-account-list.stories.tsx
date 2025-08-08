import { StoryObj, Meta } from '@storybook/react';
import {
  MultichainAccountList,
  type MultichainAccountListProps,
} from './multichain-account-list';
import { AccountGroupId } from '@metamask/account-api';
import { AccountTreeWallets } from '../../../selectors/multichain-accounts/account-tree.types';
import { AccountWalletMetadata } from '@metamask/account-tree-controller';

const mockWallets: AccountTreeWallets = {
  'entropy:01K1100EDPEV57BY4136X5CBEJ': {
    id: 'entropy:01K1100EDPEV57BY4136X5CBEJ',
    groups: {
      'entropy:01K1100EDPEV57BY4136X5CBEJ/0': {
        id: 'entropy:01K1100EDPEV57BY4136X5CBEJ/0',
        accounts: [
          '09956ce0-ab75-4716-9dad-0ed0b1d58eaf',
          '784f976c-8c14-4eee-90c1-75f7071edb49',
        ],
        metadata: {
          name: 'Account 1',
        },
      },
      'entropy:01K1100EDPEV57BY4136X5CBEJ/1': {
        id: 'entropy:01K1100EDPEV57BY4136X5CBEJ/1',
        accounts: ['b392b97b-13a2-4c70-a6ae-cd781a3f7048'],
        metadata: {
          name: 'Account 2',
        },
      },
    },
    metadata: {
      name: 'Wallet 1',
      type: 'entropy',
      entropy: {
        id: '01K1100EDPEV57BY4136X5CBEJ',
        index: 0,
      },
    } as AccountWalletMetadata,
  },
  'snap:npm:@metamask/bitcoin-wallet-snap': {
    id: 'snap:npm:@metamask/bitcoin-wallet-snap',
    groups: {
      'snap:npm:@metamask/bitcoin-wallet-snap/bc1qfp0kcnpgmp0t96nsawtl2n0vm2jdrcrvv3cvjr':
        {
          id: 'snap:npm:@metamask/bitcoin-wallet-snap/bc1qfp0kcnpgmp0t96nsawtl2n0vm2jdrcrvv3cvjr',
          accounts: ['26f57559-e378-4c3d-b523-9398155ced41'],
          metadata: {
            name: 'Bitcoin Account 1',
          },
        },
      'snap:npm:@metamask/bitcoin-wallet-snap/bc1qf6devcwfq2d5nup8j6w2c27jp8ddtpkqx3y0lt':
        {
          id: 'snap:npm:@metamask/bitcoin-wallet-snap/bc1qf6devcwfq2d5nup8j6w2c27jp8ddtpkqx3y0lt',
          accounts: ['6f1f5ae7-e971-462d-9fa3-b4d789881bbd'],
          metadata: {
            name: 'Bitcoin Account 3',
          },
        },
    },
    metadata: {
      name: 'Bitcoin',
      type: 'snap',
      snap: {
        id: 'npm:@metamask/bitcoin-wallet-snap',
      },
    } as AccountWalletMetadata,
  },
};

const defaultArgs: MultichainAccountListProps = {
  wallets: mockWallets,
  selectedAccountGroup:
    'entropy:01K1100EDPEV57BY4136X5CBEJ/0' as AccountGroupId,
};

const meta: Meta<typeof MultichainAccountList> = {
  title: 'Components/MultichainAccounts/MultichainAccountList',
  component: MultichainAccountList,
  parameters: {
    backgrounds: {
      default: 'light',
    },
  },
};

export default meta;
type Story = StoryObj<typeof MultichainAccountList>;

export const Default: Story = {
  args: defaultArgs,
};

Default.parameters = {
  docs: {
    description: {
      story:
        'Default state of MultichainAccountList showing various wallets and their accounts.',
    },
  },
};
