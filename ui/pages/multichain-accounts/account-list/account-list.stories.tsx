import React, { ReactNode } from 'react';
import { StoryObj, Meta } from '@storybook/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route } from 'react-router-dom';
import { AccountList } from './account-list';
import { configureStore } from '@reduxjs/toolkit';

const mockAccountTree = {
  wallets: {
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
        'entropy:01K1100EDPEV57BY4136X5CBEJ/2': {
          id: 'entropy:01K1100EDPEV57BY4136X5CBEJ/2',
          accounts: ['de8c7954-3575-42f3-9db7-b7da669a9b56'],
          metadata: {
            name: 'Account 3',
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
      },
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
      },
    },
    'snap:npm:@metamask/snap-simple-keyring-snap': {
      id: 'snap:npm:@metamask/snap-simple-keyring-snap',
      groups: {
        'snap:npm:@metamask/snap-simple-keyring-snap/0x6de4728d5d625ee2c583f6ed589654e2155674f2':
          {
            id: 'snap:npm:@metamask/snap-simple-keyring-snap/0x6de4728d5d625ee2c583f6ed589654e2155674f2',
            accounts: ['afb3d49c-61e1-4cd2-9fbf-749842c303f7'],
            metadata: {
              name: 'SSK Account',
            },
          },
      },
      metadata: {
        name: 'MetaMask Simple Snap Keyring',
        type: 'snap',
        snap: {
          id: 'npm:@metamask/snap-simple-keyring-snap',
        },
      },
    },
    'entropy:01K1FTF5X0KT76Q2XCPVZ75QE3': {
      id: 'entropy:01K1FTF5X0KT76Q2XCPVZ75QE3',
      groups: {
        'entropy:01K1FTF5X0KT76Q2XCPVZ75QE3/0': {
          id: 'entropy:01K1FTF5X0KT76Q2XCPVZ75QE3/0',
          accounts: [
            'fc6c40ef-5394-46cb-a700-b874693b84bf',
            'e25fb335-4018-4406-8681-e619538ceccc',
          ],
          metadata: {
            name: 'Account From Wallet 2',
          },
        },
      },
      metadata: {
        name: 'Wallet 2',
        type: 'entropy',
        entropy: {
          id: '01K1FTF5X0KT76Q2XCPVZ75QE3',
          index: 1,
        },
      },
    },
  },
  selectedAccountGroup: 'entropy:01K1100EDPEV57BY4136X5CBEJ/0',
};

const createMockStore = (accountTree = mockAccountTree) => {
  return configureStore({
    reducer: {
      metamask: () => ({
        accountTree,
      }),
    },
  });
};

type Store = ReturnType<typeof createMockStore>;

interface WrapperProps {
  children: ReactNode;
  store?: Store;
  initialEntries?: string[];
}

const Wrapper: React.FC<WrapperProps> = ({
  children,
  store,
  initialEntries = ['/accounts'],
}) => (
  <Provider store={store || createMockStore()}>
    <MemoryRouter initialEntries={initialEntries}>
      <Route path="*">{children}</Route>
    </MemoryRouter>
  </Provider>
);

const meta: Meta<typeof AccountList> = {
  title: 'Pages/MultichainAccounts/AccountList',
  component: AccountList,
  decorators: [
    (Story, context) => (
      <Wrapper store={context.parameters.store}>
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

export const Default: Story = {
  parameters: {
    store: createMockStore(),
  },
};

Default.parameters = {
  docs: {
    description: {
      story:
        'Default state of the AccountList page showing various wallets and their accounts.',
    },
  },
};
