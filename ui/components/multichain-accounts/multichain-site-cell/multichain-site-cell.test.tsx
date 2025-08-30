import React from 'react';
import { Provider } from 'react-redux';
import { render, fireEvent, screen } from '@testing-library/react';
import { CaipChainId, Hex } from '@metamask/utils';
import { EthAccountType, SolAccountType } from '@metamask/keyring-api';
import { AccountGroupType, AccountWalletType } from '@metamask/account-api';
import { AccountGroupObject } from '@metamask/account-tree-controller';
import { RpcEndpointType } from '@metamask/network-controller';
import configureStore from '../../../store/store';
import { createMockInternalAccount } from '../../../../test/jest/mocks';
import { AccountGroupWithInternalAccounts } from '../../../selectors/multichain-accounts/account-tree.types';
import { EvmAndMultichainNetworkConfigurationsWithCaipChainId } from '../../../selectors/selectors.types';
import { MultichainSiteCell } from './multichain-site-cell';

jest.mock('../../../contexts/metametrics', () => {
  const { createContext } = jest.requireActual('react');
  return {
    MetaMetricsContext: createContext(() => {}),
  };
});

const MOCK_WALLET_ID = 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ';
const MOCK_GROUP_ID_1 = 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0';
const MOCK_GROUP_ID_2 = 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/1';
const MOCK_SOLANA_CHAIN_ID = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';

const mockEvmAccount1 = createMockInternalAccount({
  id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
  name: 'EVM Account 1',
  address: '0x1111111111111111111111111111111111111111',
  type: EthAccountType.Eoa,
});

const mockEvmAccount2 = createMockInternalAccount({
  id: '07c2cfec-36c9-46c4-8115-3836d3ac9047',
  name: 'EVM Account 2',
  address: '0x2222222222222222222222222222222222222222',
  type: EthAccountType.Eoa,
});

const mockSolAccount1 = createMockInternalAccount({
  id: '784225f4-d30b-4e77-a900-c8bbce735b88',
  name: 'Solana Account 1',
  address: 'So1anaAddr1111111111111111111111111111111111',
  type: SolAccountType.DataAccount,
});

const mockSolAccount2 = createMockInternalAccount({
  id: '9b6b30a0-3c87-4a33-9d10-a27a2aba2ba2',
  name: 'Solana Account 2',
  address: 'So1anaAddr2222222222222222222222222222222222',
  type: SolAccountType.DataAccount,
});

const mockAccountGroups: AccountGroupWithInternalAccounts[] = [
  {
    id: MOCK_GROUP_ID_1,
    type: AccountGroupType.MultichainAccount,
    metadata: {
      name: 'Test Group 1',
      pinned: false,
      hidden: false,
      entropy: {
        groupIndex: 0,
      },
    },
    accounts: [mockEvmAccount1, mockSolAccount1],
  },
  {
    id: MOCK_GROUP_ID_2,
    type: AccountGroupType.MultichainAccount,
    metadata: {
      name: 'Test Group 2',
      pinned: false,
      hidden: false,
      entropy: {
        groupIndex: 1,
      },
    },
    accounts: [mockEvmAccount2, mockSolAccount2],
  },
];

const mockNetworks: EvmAndMultichainNetworkConfigurationsWithCaipChainId[] = [
  {
    name: 'Ethereum Mainnet',
    chainId: '0x1' as Hex,
    caipChainId: 'eip155:1' as CaipChainId,
    blockExplorerUrls: ['https://etherscan.io'],
    defaultBlockExplorerUrlIndex: 0,
    defaultRpcEndpointIndex: 0,
    nativeCurrency: 'ETH',
    rpcEndpoints: [
      {
        networkClientId: 'mainnet',
        type: RpcEndpointType.Custom,
        url: 'https://mainnet.infura.io/v3/',
      },
    ],
  },
  {
    name: 'Polygon',
    chainId: '0x89' as Hex,
    caipChainId: 'eip155:137' as CaipChainId,
    blockExplorerUrls: ['https://polygonscan.com'],
    defaultBlockExplorerUrlIndex: 0,
    defaultRpcEndpointIndex: 0,
    nativeCurrency: 'MATIC',
    rpcEndpoints: [
      {
        networkClientId: 'polygon',
        type: RpcEndpointType.Custom,
        url: 'https://polygon-rpc.com',
      },
    ],
  },
];

const mockTestNetworks: EvmAndMultichainNetworkConfigurationsWithCaipChainId[] =
  [
    {
      name: 'Sepolia',
      chainId: '0xaa36a7' as Hex,
      caipChainId: 'eip155:11155111' as CaipChainId,
      blockExplorerUrls: ['https://sepolia.etherscan.io'],
      defaultBlockExplorerUrlIndex: 0,
      defaultRpcEndpointIndex: 0,
      nativeCurrency: 'ETH',
      rpcEndpoints: [
        {
          networkClientId: 'sepolia',
          type: RpcEndpointType.Custom,
          url: 'https://sepolia.infura.io/v3/',
        },
      ],
    },
  ];

const createMockState = (overrides = {}) => ({
  metamask: {
    useBlockie: false,
    keyrings: [
      {
        type: 'HD Key Tree',
        accounts: [mockEvmAccount1.address, mockEvmAccount2.address],
      },
      {
        type: 'Simple Key Pair',
        accounts: [mockSolAccount1.address, mockSolAccount2.address],
      },
    ],
    accountTree: {
      selectedAccountGroup: MOCK_GROUP_ID_1,
      wallets: {
        [MOCK_WALLET_ID]: {
          id: MOCK_WALLET_ID,
          type: AccountWalletType.Entropy,
          metadata: {
            name: 'Test Wallet 1',
            entropy: {
              id: '01JKAF3DSGM3AB87EM9N0K41AJ',
            },
          },
          groups: {
            [MOCK_GROUP_ID_1]: {
              id: MOCK_GROUP_ID_1,
              type: AccountGroupType.MultichainAccount,
              metadata: {
                name: 'Test Group 1',
                pinned: false,
                hidden: false,
                entropy: {
                  groupIndex: 0,
                },
              },
              accounts: [mockEvmAccount1.id, mockSolAccount1.id],
            },
            [MOCK_GROUP_ID_2]: {
              id: MOCK_GROUP_ID_2,
              type: AccountGroupType.MultichainAccount,
              metadata: {
                name: 'Test Group 2',
                pinned: false,
                hidden: false,
                entropy: {
                  groupIndex: 1,
                },
              },
              accounts: [mockEvmAccount2.id, mockSolAccount2.id],
            },
          },
        },
      },
    },
    internalAccounts: {
      accounts: {
        [mockEvmAccount1.id]: {
          ...mockEvmAccount1,
          scopes: ['eip155:0'],
        },
        [mockEvmAccount2.id]: {
          ...mockEvmAccount2,
          scopes: ['eip155:0'],
        },
        [mockSolAccount1.id]: {
          ...mockSolAccount1,
          scopes: [MOCK_SOLANA_CHAIN_ID],
        },
        [mockSolAccount2.id]: {
          ...mockSolAccount2,
          scopes: [MOCK_SOLANA_CHAIN_ID],
        },
      },
      selectedAccount: mockEvmAccount1.id,
    },
    ...overrides,
  },
});

const renderComponent = (props = {}, stateOverrides = {}) => {
  const defaultProps = {
    nonTestNetworks: mockNetworks,
    testNetworks: mockTestNetworks,
    accountsGroups: mockAccountGroups,
    onSelectAccountGroupIds: jest.fn(),
    onSelectChainIds: jest.fn(),
    selectedAccountGroupIds: [MOCK_GROUP_ID_1 as AccountGroupObject['id']],
    selectedChainIds: ['eip155:1' as CaipChainId],
    isConnectFlow: false,
    hideAllToasts: jest.fn(),
  };

  const store = configureStore(createMockState(stateOverrides));

  return render(
    <Provider store={store}>
      <MultichainSiteCell
        showEditAccounts={jest.fn()}
        {...defaultProps}
        {...props}
        supportedAccountGroups={mockAccountGroups}
      />
    </Provider>,
  );
};

describe('MultichainSiteCell', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('renders the component with accounts and networks sections', () => {
      renderComponent();

      expect(
        screen.getAllByTestId('site-cell-connection-list-item'),
      ).toHaveLength(2);
    });

    it('displays correct account information for single account', () => {
      renderComponent({
        selectedAccountGroupIds: [MOCK_GROUP_ID_1 as AccountGroupObject['id']],
      });

      // Should show the component sections
      expect(
        screen.getAllByTestId('site-cell-connection-list-item'),
      ).toHaveLength(2);
    });

    it('displays tooltip for multiple accounts', () => {
      renderComponent({
        selectedAccountGroupIds: [
          MOCK_GROUP_ID_1,
          MOCK_GROUP_ID_2,
        ] as AccountGroupObject['id'][],
      });

      expect(screen.getAllByTestId('avatar-group').length).toBeGreaterThan(0);
    });
  });

  describe('toast handling', () => {
    it('calls hideAllToasts when edit accounts is clicked', () => {
      const hideAllToasts = jest.fn();
      renderComponent({ hideAllToasts });

      const editButtons = screen.getAllByTestId('edit');
      fireEvent.click(editButtons[0]); // First edit button is for accounts

      expect(hideAllToasts).toHaveBeenCalled();
    });

    it('calls hideAllToasts when edit networks is clicked', () => {
      const hideAllToasts = jest.fn();
      renderComponent({ hideAllToasts });

      const editButtons = screen.getAllByTestId('edit');
      fireEvent.click(editButtons[1]); // Second edit button is for networks

      expect(hideAllToasts).toHaveBeenCalled();
    });

    it('does not throw if hideAllToasts is not provided', () => {
      renderComponent({ hideAllToasts: undefined });

      expect(() => {
        const editButtons = screen.getAllByTestId('edit');
        fireEvent.click(editButtons[0]);
        fireEvent.click(editButtons[1]);
      }).not.toThrow();
    });
  });

  describe('network filtering', () => {
    it('filters selected networks correctly', () => {
      renderComponent({
        selectedChainIds: [
          'eip155:1' as CaipChainId,
          'eip155:137' as CaipChainId,
        ],
      });

      expect(screen.getAllByTestId('avatar-group').length).toBeGreaterThan(0);
    });

    it('handles empty selected networks', () => {
      renderComponent({
        selectedChainIds: [],
      });

      expect(
        screen.getAllByTestId('site-cell-connection-list-item'),
      ).toHaveLength(2);
    });

    it('combines test and non-test networks', () => {
      renderComponent({
        selectedChainIds: ['eip155:11155111' as CaipChainId],
      });

      expect(
        screen.getAllByTestId('site-cell-connection-list-item'),
      ).toHaveLength(2);
    });
  });

  describe('avatar display logic', () => {
    it('shows AvatarAccount for single selected account group', () => {
      renderComponent({
        selectedAccountGroupIds: [MOCK_GROUP_ID_1 as AccountGroupObject['id']],
      });

      // With single account, should not show tooltip in the accounts section
      const editButtons = screen.getAllByTestId('edit');
      expect(editButtons).toHaveLength(2);
    });

    it('shows MultichainSiteCellTooltip for multiple selected account groups', () => {
      renderComponent({
        selectedAccountGroupIds: [
          MOCK_GROUP_ID_1,
          MOCK_GROUP_ID_2,
        ] as AccountGroupObject['id'][],
      });

      expect(screen.getAllByTestId('avatar-group').length).toBeGreaterThan(0);
    });

    it('handles missing account group gracefully', () => {
      renderComponent({
        selectedAccountGroupIds: [
          'non-existent-group' as AccountGroupObject['id'],
        ],
      });

      expect(
        screen.getAllByTestId('site-cell-connection-list-item'),
      ).toHaveLength(2);
    });
  });

  it('handles empty account groups array', () => {
    renderComponent({
      accountsGroups: [],
      selectedAccountGroupIds: [] as AccountGroupObject['id'][],
    });

    expect(
      screen.getAllByTestId('site-cell-connection-list-item'),
    ).toHaveLength(2);
  });

  it('handles empty networks arrays', () => {
    renderComponent({
      nonTestNetworks: [],
      testNetworks: [],
      selectedChainIds: [],
    });

    expect(
      screen.getAllByTestId('site-cell-connection-list-item'),
    ).toHaveLength(2);
  });

  it('handles undefined isConnectFlow prop', () => {
    renderComponent({
      isConnectFlow: undefined,
    });

    expect(
      screen.getAllByTestId('site-cell-connection-list-item'),
    ).toHaveLength(2);
  });
});
