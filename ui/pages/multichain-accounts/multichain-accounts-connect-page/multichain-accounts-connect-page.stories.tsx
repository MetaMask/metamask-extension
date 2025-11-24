import React, { ReactNode } from 'react';
import { StoryObj, Meta } from '@storybook/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route } from 'react-router-dom';
import { action } from '@storybook/addon-actions';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from '@metamask/chain-agnostic-permission';
import {
  AccountWalletType,
  AccountGroupType,
  AccountGroupId,
} from '@metamask/account-api';
import { MultichainAccountsConnectPage } from './multichain-accounts-connect-page';
import mockState from '../../../../test/data/mock-state.json';
import configureStore from '../../../store/store';
import { createMockMultichainAccountsState } from '../../../selectors/multichain-accounts/test-utils';

const mockTargetSubjectMetadata = {
  extensionId: null,
  iconUrl: 'https://metamask.github.io/test-dapp/metamask-fox.svg',
  name: 'E2E Test Dapp',
  origin: 'https://metamask.github.io',
  subjectType: 'website' as const,
};

const mockAccountTreeState = {
  wallets: {
    'entropy:01JKAF3DSGM3AB87EM9N0K41AJ': {
      id: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ' as const,
      type: AccountWalletType.Entropy as const,
      status: 'ready' as const,
      groups: {
        'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0': {
          id: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0' as const,
          type: AccountGroupType.MultichainAccount as const,
          accounts: ['test-account-1'] as [string, ...string[]],
          metadata: {
            name: 'Test Account Group 1',
            entropy: { groupIndex: 0 },
            pinned: false,
            hidden: false,
          },
        },
        'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/1': {
          id: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/1' as const,
          type: AccountGroupType.MultichainAccount as const,
          accounts: ['test-account-2'] as [string, ...string[]],
          metadata: {
            name: 'Test Account Group 2',
            entropy: { groupIndex: 1 },
            pinned: false,
            hidden: false,
          },
        },
      },
      metadata: {
        name: 'Test Wallet',
        entropy: { id: '01JKAF3DSGM3AB87EM9N0K41AJ' },
      },
    },
  },
  selectedAccountGroup:
    'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0' as AccountGroupId,
};

const mockInternalAccountsState = {
  accounts: {
    'test-account-1': {
      id: 'test-account-1',
      address: '0xc5b2b5ae370876c0122910f92a13bef85a133e56',
      metadata: {
        name: 'Test Account 1',
        importTime: Date.now(),
        keyring: { type: 'HD Key Tree' },
        snap: {
          name: 'Test Snap',
          id: 'test-snap-id',
          enabled: true,
        },
      },
      options: {},
      methods: ['eth_sendTransaction', 'eth_sign'],
      type: 'eip155:eoa' as const,
      scopes: ['eip155:1', 'eip155:0'] as `${string}:${string}`[],
    },
    'test-account-2': {
      id: 'test-account-2',
      address: '0x456789abcdef0123456789abcdef0123456789ab',
      metadata: {
        name: 'Test Account 2',
        importTime: Date.now(),
        keyring: { type: 'HD Key Tree' },
        snap: {
          name: 'Test Snap',
          id: 'test-snap-id',
          enabled: true,
        },
      },
      options: {},
      methods: ['eth_sendTransaction', 'eth_sign'],
      type: 'eip155:eoa' as const,
      scopes: ['eip155:1', 'eip155:137'] as `${string}:${string}`[],
    },
  },
  selectedAccount: 'test-account-1',
};

const mockNetworkConfigurations = {
  networkConfigurationsByChainId: {},
  multichainNetworkConfigurationsByChainId: {},
};

const mockMultichainState = createMockMultichainAccountsState(
  mockAccountTreeState,
  mockInternalAccountsState,
  mockNetworkConfigurations,
);

const store = configureStore({
  ...mockState,
  ...mockMultichainState,
  metamask: {
    ...mockState.metamask,
    ...mockMultichainState.metamask,
    // Preserve the network configuration from mockState
    selectedNetworkClientId: mockState.metamask.selectedNetworkClientId,
    networkConfigurationsByChainId: mockState.metamask.networkConfigurationsByChainId,
    permissionHistory: {
      'https://test.dapp': {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        eth_accounts: {
          accounts: {
            '0x123': 1709225290848,
          },
        },
      },
    },
    multichainNetwork: {
      chainId: 'eip155:1',
      name: 'Ethereum Mainnet',
      nativeCurrency: { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
    },
  },
  activeTab: {
    origin: 'https://test.dapp',
  },
});

interface WrapperProps {
  children: ReactNode;
}

const Wrapper: React.FC<WrapperProps> = ({ children }) => (
  <Provider store={store}>
    <MemoryRouter initialEntries={['/multichain-accounts-connect']}>
      <Route path="*">{children}</Route>
    </MemoryRouter>
  </Provider>
);

const meta: Meta<typeof MultichainAccountsConnectPage> = {
  title: 'Pages/MultichainAccounts/MultichainAccountsConnectPage',
  component: MultichainAccountsConnectPage,
  decorators: [
    (Story) => (
      <Wrapper>
        <Story />
      </Wrapper>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MultichainAccountsConnectPage>;

export const Default: Story = {
  args: {
    request: {
      permissions: {
        [Caip25EndowmentPermissionName]: {
          caveats: [
            {
              type: Caip25CaveatType,
              value: {
                requiredScopes: {},
                optionalScopes: {
                  'eip155:1': {
                    accounts: [],
                  },
                },
                sessionProperties: {},
                isMultichainOrigin: true,
              },
            },
          ],
        },
      },
      metadata: {
        id: '1',
        origin: mockTargetSubjectMetadata.origin,
        isEip1193Request: false,
      },
    },
    permissionsRequestId: '1',
    rejectPermissionsRequest: action('rejectPermissionsRequest'),
    approveConnection: action('approveConnection'),
    targetSubjectMetadata: mockTargetSubjectMetadata,
  },
};
