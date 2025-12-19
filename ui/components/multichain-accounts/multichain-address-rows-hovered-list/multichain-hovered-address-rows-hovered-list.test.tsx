import React from 'react';
import { screen, fireEvent, waitFor, act } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import { InternalAccount } from '@metamask/keyring-internal-api';
import {
  AccountGroupId,
  AccountGroupType,
  AccountWalletType,
  toAccountWalletId,
} from '@metamask/account-api';
import { CaipChainId } from '@metamask/utils';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { MULTICHAIN_ACCOUNT_ADDRESS_LIST_PAGE_ROUTE } from '../../../helpers/constants/routes';
import {
  getInternalAccountListSpreadByScopesByGroupId,
  getAllAccountGroups,
} from '../../../selectors/multichain-accounts/account-tree';
import { getNetworksByScopes } from '../../../../shared/modules/selectors/networks';
import { selectBalanceForAllWallets } from '../../../selectors/assets';
import { MultichainHoveredAddressRowsList } from './multichain-hovered-address-rows-hovered-list';

const mockStore = configureStore([]);
const mockUseNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  return {
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockUseNavigate,
  };
});

jest.mock('../../../selectors/multichain-accounts/account-tree', () => ({
  ...jest.requireActual('../../../selectors/multichain-accounts/account-tree'),
  getInternalAccountListSpreadByScopesByGroupId: jest.fn(),
  getAllAccountGroups: jest.fn(),
}));

jest.mock('../../../../shared/modules/selectors/networks', () => ({
  ...jest.requireActual('../../../../shared/modules/selectors/networks'),
  getNetworksByScopes: jest.fn(),
}));

jest.mock('../../../selectors/assets', () => ({
  ...jest.requireActual('../../../selectors/assets'),
  selectBalanceForAllWallets: jest.fn(),
}));

jest.mock('../../../hooks/useFormatters', () => ({
  useFormatters: () => ({
    formatCurrencyWithMinThreshold: jest.fn(
      (value, currency) => `${currency}${value}`,
    ),
  }),
}));

jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

const mockHandleCopy = jest.fn();
jest.mock('../../../hooks/useCopyToClipboard', () => ({
  useCopyToClipboard: () => [false, mockHandleCopy],
}));

// Test constants
const TEST_STRINGS = {
  VIEW_ALL_TEXT: 'multichainAddressViewAll',
  EVM_NETWORKS: 'networkNameEthereum',
  BITCOIN_NETWORK: 'networkNameBitcoinSegwit',
  SOLANA_NETWORK: 'Solana',
  TRON_NETWORK: 'Tron',
} as const;

const TEST_IDS = {
  MULTICHAIN_ADDRESS_ROWS_LIST: 'multichain-address-rows-list',
  MULTICHAIN_ADDRESS_ROW: 'multichain-address-row',
  AVATAR_GROUP: 'avatar-group',
  HOVER_TRIGGER: 'hover-trigger',
} as const;

const mockWalletEntropySource = '01K437Z7EJ0VCMFDE9TQKRV60A';
const WALLET_ID_MOCK = toAccountWalletId(
  AccountWalletType.Entropy,
  mockWalletEntropySource,
);
const GROUP_ID_MOCK = `${WALLET_ID_MOCK}/0` as AccountGroupId;
const SPECIAL_GROUP_ID = `${WALLET_ID_MOCK}/special-0` as AccountGroupId;
const ACCOUNT_EVM_ID_MOCK =
  'entropy:01K437Z7EJ0VCMFDE9TQKRV60A:multichain-account:01K437Z7EJ0VCMFDE9TQKRV60A:eoa:0x4b42aed7d99fc7874a56e6003629c89210a31c34';
const ACCOUNT_BITCOIN_ID_MOCK =
  'bitcoin:mainnet:4e445ed5a8c09d4d3be8e7fbf7dc3314';
const ACCOUNT_SOLANA_ID_MOCK =
  'solana:mainnet:5e445ed5a8c09d4d3be8e7fbf7dc3314';
const ACCOUNT_TRON_ID_MOCK = 'tron:mainnet:6e445ed5a8c09d4d3be8e7fbf7dc3314';

const INTERNAL_ACCOUNTS_MOCK: Record<string, InternalAccount> = {
  [ACCOUNT_EVM_ID_MOCK]: {
    id: ACCOUNT_EVM_ID_MOCK,
    address: '0x4b42aed7d99fc7874a56e6003629c89210a31c34',
    metadata: {
      name: 'EVM Account',
      importTime: Date.now(),
      keyring: { type: 'HD Key Tree' },
    },
    options: {},
    methods: [],
    type: 'eip155:eoa',
    scopes: [
      'eip155:1',
      'eip155:137',
      'eip155:42161',
      'eip155:11155111',
      'eip155:59144',
    ],
  },
  [ACCOUNT_BITCOIN_ID_MOCK]: {
    id: ACCOUNT_BITCOIN_ID_MOCK,
    address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
    metadata: {
      name: 'Bitcoin Account',
      importTime: Date.now(),
      keyring: { type: 'Snap Keyring' },
    },
    options: {},
    methods: [],
    type: 'bip122:p2wpkh',
    scopes: ['bip122:000000000019d6689c085ae165831e93'],
  },
  [ACCOUNT_SOLANA_ID_MOCK]: {
    id: ACCOUNT_SOLANA_ID_MOCK,
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    metadata: {
      name: 'Solana Account',
      importTime: Date.now(),
      keyring: { type: 'Snap Keyring' },
    },
    options: {},
    methods: [],
    type: 'solana:data-account',
    scopes: ['solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'],
  },
  [ACCOUNT_TRON_ID_MOCK]: {
    id: ACCOUNT_TRON_ID_MOCK,
    address: 'TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9',
    metadata: {
      name: 'Tron Account',
      importTime: Date.now(),
      keyring: { type: 'Snap Keyring' },
    },
    options: {},
    methods: [],
    type: 'tron:eoa',
    scopes: ['tron:0x2b6653dc'],
  },
};

const ACCOUNT_TREE_MOCK = {
  wallets: {
    [WALLET_ID_MOCK]: {
      type: 'entropy',
      id: WALLET_ID_MOCK,
      metadata: {},
      groups: {
        [GROUP_ID_MOCK]: {
          type: 'multichain-account',
          id: GROUP_ID_MOCK,
          metadata: {},
          accounts: [
            ACCOUNT_EVM_ID_MOCK,
            ACCOUNT_BITCOIN_ID_MOCK,
            ACCOUNT_SOLANA_ID_MOCK,
            ACCOUNT_TRON_ID_MOCK,
          ],
        },
      },
    },
  },
};

const createMockState = () => ({
  metamask: {
    completedOnboarding: true,
    internalAccounts: {
      accounts: INTERNAL_ACCOUNTS_MOCK,
      selectedAccount: ACCOUNT_EVM_ID_MOCK,
    },
    accountTree: ACCOUNT_TREE_MOCK,
    networkConfigurationsByChainId: {
      '0x1': {
        chainId: '0x1',
        name: 'Ethereum',
        nativeCurrency: 'ETH',
      },
      '0x89': {
        chainId: '0x89',
        name: 'Polygon',
        nativeCurrency: 'MATIC',
      },
      '0xa4b1': {
        chainId: '0xa4b1',
        name: 'Arbitrum',
        nativeCurrency: 'ETH',
      },
      '0xaa36a7': {
        chainId: '0xaa36a7',
        name: 'Sepolia',
        nativeCurrency: 'ETH',
      },
      '0xe708': {
        chainId: '0xe708',
        name: 'Linea',
        nativeCurrency: 'ETH',
      },
    },
    multichainNetworkConfigurationsByChainId: {
      'eip155:1': {
        chainId: 'eip155:1',
        name: 'Ethereum',
        isEvm: true,
        nativeCurrency: 'ETH',
      },
      'eip155:137': {
        chainId: 'eip155:137',
        name: 'Polygon',
        isEvm: true,
        nativeCurrency: 'MATIC',
      },
      'eip155:42161': {
        chainId: 'eip155:42161',
        name: 'Arbitrum',
        isEvm: true,
        nativeCurrency: 'ETH',
      },
      'eip155:11155111': {
        chainId: 'eip155:11155111',
        name: 'Sepolia',
        isEvm: true,
        nativeCurrency: 'ETH',
      },
      'eip155:59144': {
        chainId: 'eip155:59144',
        name: 'Linea',
        isEvm: true,
        nativeCurrency: 'ETH',
      },
      'bip122:000000000019d6689c085ae165831e93': {
        chainId: 'bip122:000000000019d6689c085ae165831e93',
        name: 'Bitcoin',
        isEvm: false,
        nativeCurrency: 'BTC',
      },
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': {
        chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
        name: 'Solana',
        isEvm: false,
        nativeCurrency: 'SOL',
      },
      'tron:0x2b6653dc': {
        chainId: 'tron:0x2b6653dc',
        name: 'Tron',
        isEvm: false,
        nativeCurrency: 'TRX',
      },
    },
  },
});

const createMockAccountGroup = (
  groupId: AccountGroupId,
  walletId: string,
  name: string,
  groupIndex: number,
  accounts: string[],
) => ({
  id: groupId,
  walletId,
  type: AccountGroupType.MultichainAccount,
  metadata: {
    name,
    entropy: {
      groupIndex,
    },
    pinned: false,
    hidden: false,
  },
  accounts,
});

const createMockBalance = (
  walletId: string,
  groupId: AccountGroupId,
  totalBalance: number,
  currency: string,
) => ({
  totalBalanceInUserCurrency: totalBalance,
  userCurrency: currency,
  wallets: {
    [walletId]: {
      walletId,
      totalBalanceInUserCurrency: totalBalance,
      userCurrency: currency,
      groups: {
        [groupId]: {
          totalBalanceInUserCurrency: totalBalance,
          userCurrency: currency,
          walletId,
          groupId,
        },
      },
    },
  },
});

const renderComponent = (
  groupId: AccountGroupId = GROUP_ID_MOCK,
  onViewAllClick?: () => void,
) => {
  const store = mockStore(createMockState());
  return renderWithProvider(
    <MultichainHoveredAddressRowsList
      groupId={groupId}
      onViewAllClick={onViewAllClick}
    >
      <div data-testid="hover-trigger">Hover Me</div>
    </MultichainHoveredAddressRowsList>,
    store,
  );
};

const mockedGetInternalAccountListSpreadByScopesByGroupId =
  getInternalAccountListSpreadByScopesByGroupId as jest.MockedFunction<
    typeof getInternalAccountListSpreadByScopesByGroupId
  >;
const mockedGetNetworksByScopes = getNetworksByScopes as jest.MockedFunction<
  typeof getNetworksByScopes
>;
const mockedGetAllAccountGroups = getAllAccountGroups as jest.MockedFunction<
  typeof getAllAccountGroups
>;
const mockedSelectBalanceForAllWallets =
  selectBalanceForAllWallets as jest.MockedFunction<
    typeof selectBalanceForAllWallets
  >;

describe('MultichainHoveredAddressRowsList', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockedGetAllAccountGroups.mockReturnValue([
      createMockAccountGroup(
        GROUP_ID_MOCK,
        WALLET_ID_MOCK,
        'Test Account Group',
        0,
        [ACCOUNT_EVM_ID_MOCK],
      ),
    ] as never);

    mockedSelectBalanceForAllWallets.mockReturnValue(
      createMockBalance(WALLET_ID_MOCK, GROUP_ID_MOCK, 100.5, 'USD') as never,
    );

    mockedGetNetworksByScopes.mockImplementation((_, scopes) => {
      const networkMap: Record<string, { name: string; chainId: string }> = {
        'bip122:000000000019d6689c085ae165831e93': {
          name: 'Bitcoin',
          chainId: 'bip122:000000000019d6689c085ae165831e93',
        },
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': {
          name: 'Solana',
          chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
        },
        'tron:0x2b6653dc': { name: 'Tron', chainId: 'tron:0x2b6653dc' },
        'eip155:1': { name: 'Ethereum', chainId: 'eip155:1' },
        'eip155:137': { name: 'Polygon', chainId: 'eip155:137' },
        'eip155:42161': { name: 'Arbitrum', chainId: 'eip155:42161' },
        'eip155:59144': { name: 'Linea', chainId: 'eip155:59144' },
      };

      return (scopes as string[])
        .map((scope) => networkMap[scope])
        .filter(Boolean);
    });

    mockedGetInternalAccountListSpreadByScopesByGroupId.mockReturnValue([
      {
        account: INTERNAL_ACCOUNTS_MOCK[ACCOUNT_EVM_ID_MOCK],
        scope: 'eip155:1' as CaipChainId,
        networkName: 'Ethereum',
      },
      {
        account: INTERNAL_ACCOUNTS_MOCK[ACCOUNT_EVM_ID_MOCK],
        scope: 'eip155:137' as CaipChainId,
        networkName: 'Polygon',
      },
      {
        account: INTERNAL_ACCOUNTS_MOCK[ACCOUNT_EVM_ID_MOCK],
        scope: 'eip155:42161' as CaipChainId,
        networkName: 'Arbitrum',
      },
      {
        account: INTERNAL_ACCOUNTS_MOCK[ACCOUNT_EVM_ID_MOCK],
        scope: 'eip155:59144' as CaipChainId,
        networkName: 'Linea',
      },
      {
        account: INTERNAL_ACCOUNTS_MOCK[ACCOUNT_BITCOIN_ID_MOCK],
        scope: 'bip122:000000000019d6689c085ae165831e93' as CaipChainId,
        networkName: 'Bitcoin',
      },
      {
        account: INTERNAL_ACCOUNTS_MOCK[ACCOUNT_SOLANA_ID_MOCK],
        scope: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp' as CaipChainId,
        networkName: 'Solana',
      },
      {
        account: INTERNAL_ACCOUNTS_MOCK[ACCOUNT_TRON_ID_MOCK],
        scope: 'tron:0x2b6653dc' as CaipChainId,
        networkName: 'Tron',
      },
    ]);
  });

  it('renders the component with aggregated rows', async () => {
    renderComponent();

    const triggerElement = screen.getByTestId(TEST_IDS.HOVER_TRIGGER);
    fireEvent.mouseEnter(triggerElement.parentElement as HTMLElement);
    await waitFor(() => {
      expect(
        screen.getByTestId(TEST_IDS.MULTICHAIN_ADDRESS_ROWS_LIST),
      ).toBeInTheDocument();
    });

    const addressRows = screen.getAllByTestId(TEST_IDS.MULTICHAIN_ADDRESS_ROW);
    expect(addressRows.length).toBeGreaterThan(0);
  });

  it('groups all eip155 scopes together', async () => {
    renderComponent();

    const triggerElement = screen.getByTestId(TEST_IDS.HOVER_TRIGGER);
    fireEvent.mouseEnter(triggerElement.parentElement as HTMLElement);
    await waitFor(() => {
      expect(
        screen.getByTestId(TEST_IDS.MULTICHAIN_ADDRESS_ROWS_LIST),
      ).toBeInTheDocument();
    });

    const evmRow = screen
      .getByText(TEST_STRINGS.EVM_NETWORKS)
      .closest(`[data-testid="${TEST_IDS.MULTICHAIN_ADDRESS_ROW}"]`);
    expect(evmRow).toBeInTheDocument();

    // Verify that avatar group is rendered for the EVM row
    const avatarGroup = evmRow?.querySelector('[data-testid="avatar-group"]');
    expect(avatarGroup).toBeInTheDocument();
  });

  it('displays separate rows for non-eip155 accounts', async () => {
    renderComponent();

    const triggerElement = screen.getByTestId(TEST_IDS.HOVER_TRIGGER);
    fireEvent.mouseEnter(triggerElement.parentElement as HTMLElement);
    await waitFor(() => {
      expect(
        screen.getByTestId(TEST_IDS.MULTICHAIN_ADDRESS_ROWS_LIST),
      ).toBeInTheDocument();
    });

    expect(screen.getByText(TEST_STRINGS.BITCOIN_NETWORK)).toBeInTheDocument();
    expect(screen.getByText(TEST_STRINGS.SOLANA_NETWORK)).toBeInTheDocument();
    expect(screen.getByText(TEST_STRINGS.TRON_NETWORK)).toBeInTheDocument();
  });

  it('applies priority sorting with grouped eip155 first', async () => {
    renderComponent();

    const triggerElement = screen.getByTestId(TEST_IDS.HOVER_TRIGGER);
    fireEvent.mouseEnter(triggerElement.parentElement as HTMLElement);
    await waitFor(() => {
      expect(
        screen.getByTestId(TEST_IDS.MULTICHAIN_ADDRESS_ROWS_LIST),
      ).toBeInTheDocument();
    });

    const addressRows = screen.getAllByTestId(TEST_IDS.MULTICHAIN_ADDRESS_ROW);
    const rowTexts = addressRows.map((row) => row.textContent);

    expect(rowTexts[0]).toContain(TEST_STRINGS.EVM_NETWORKS);
    expect(rowTexts[1]).toContain(TEST_STRINGS.BITCOIN_NETWORK);
    expect(rowTexts[2]).toContain(TEST_STRINGS.SOLANA_NETWORK);
    expect(rowTexts[3]).toContain(TEST_STRINGS.TRON_NETWORK);
  });

  it('handles copy functionality for aggregated rows', async () => {
    renderComponent();

    const triggerElement = screen.getByTestId(TEST_IDS.HOVER_TRIGGER);
    fireEvent.mouseEnter(triggerElement.parentElement as HTMLElement);
    await waitFor(() => {
      expect(
        screen.getByTestId(TEST_IDS.MULTICHAIN_ADDRESS_ROWS_LIST),
      ).toBeInTheDocument();
    });

    const evmRow = screen
      .getByText(TEST_STRINGS.EVM_NETWORKS)
      .closest(`[data-testid="${TEST_IDS.MULTICHAIN_ADDRESS_ROW}"]`);
    const copyButton = evmRow?.querySelector('[aria-label*="copy"]');

    expect(copyButton).toBeInTheDocument();

    if (copyButton) {
      fireEvent.click(copyButton);
      expect(mockHandleCopy).toHaveBeenCalledWith(
        '0x4B42aED7d99fC7874A56E6003629c89210A31C34',
      );
    }
  });

  it('displays truncated addresses', async () => {
    renderComponent();

    const triggerElement = screen.getByTestId(TEST_IDS.HOVER_TRIGGER);
    fireEvent.mouseEnter(triggerElement.parentElement as HTMLElement);
    await waitFor(() => {
      expect(
        screen.getByTestId(TEST_IDS.MULTICHAIN_ADDRESS_ROWS_LIST),
      ).toBeInTheDocument();
    });

    const addressElements = screen.getAllByText(/0x\w+\.\.\.\w+/u);
    expect(addressElements.length).toBeGreaterThan(0);
  });

  it('handles invalid group id gracefully', async () => {
    mockedGetInternalAccountListSpreadByScopesByGroupId.mockReturnValue([]);
    renderComponent('invalid-group-id' as AccountGroupId);

    const triggerElement = screen.getByTestId(TEST_IDS.HOVER_TRIGGER);
    fireEvent.mouseEnter(triggerElement.parentElement as HTMLElement);
    await waitFor(() => {
      expect(
        screen.getByTestId(TEST_IDS.MULTICHAIN_ADDRESS_ROWS_LIST),
      ).toBeInTheDocument();
    });

    expect(
      screen.queryAllByTestId(TEST_IDS.MULTICHAIN_ADDRESS_ROW),
    ).toHaveLength(0);
  });

  it('groups eip155 scopes together for each account', async () => {
    renderComponent();

    const triggerElement = screen.getByTestId(TEST_IDS.HOVER_TRIGGER);
    fireEvent.mouseEnter(triggerElement.parentElement as HTMLElement);
    await waitFor(() => {
      expect(
        screen.getByTestId(TEST_IDS.MULTICHAIN_ADDRESS_ROWS_LIST),
      ).toBeInTheDocument();
    });

    const evmRow = screen
      .getByText(TEST_STRINGS.EVM_NETWORKS)
      .closest(`[data-testid="${TEST_IDS.MULTICHAIN_ADDRESS_ROW}"]`);
    expect(evmRow).toBeInTheDocument();

    // Verify that avatar group is rendered for the EVM row
    const avatarGroup = evmRow?.querySelector('[data-testid="avatar-group"]');
    expect(avatarGroup).toBeInTheDocument();

    expect(screen.getByText(TEST_STRINGS.BITCOIN_NETWORK)).toBeInTheDocument();
    expect(screen.getByText(TEST_STRINGS.SOLANA_NETWORK)).toBeInTheDocument();
    expect(screen.getByText(TEST_STRINGS.TRON_NETWORK)).toBeInTheDocument();
  });

  it('respects priority order when multiple accounts have priority chains', async () => {
    renderComponent();

    const triggerElement = screen.getByTestId(TEST_IDS.HOVER_TRIGGER);
    fireEvent.mouseEnter(triggerElement.parentElement as HTMLElement);
    await waitFor(() => {
      expect(
        screen.getByTestId(TEST_IDS.MULTICHAIN_ADDRESS_ROWS_LIST),
      ).toBeInTheDocument();
    });

    const addressRows = screen.getAllByTestId(TEST_IDS.MULTICHAIN_ADDRESS_ROW);

    expect(addressRows.length).toBe(4);

    const groupNames = addressRows.map((row) => {
      // Find the Text element containing the network name
      // It's the first Text element after the network group avatar
      const textElements = row.querySelectorAll('p');
      // The network name is typically the first text element in the row
      // We'll find it by checking which text matches our expected network names
      for (const textEl of textElements) {
        const text = textEl.textContent?.trim() || '';
        if (
          text === TEST_STRINGS.EVM_NETWORKS ||
          text === TEST_STRINGS.BITCOIN_NETWORK ||
          text === TEST_STRINGS.SOLANA_NETWORK ||
          text === TEST_STRINGS.TRON_NETWORK
        ) {
          return text;
        }
      }
      return '';
    });

    expect(groupNames).toEqual([
      TEST_STRINGS.EVM_NETWORKS,
      TEST_STRINGS.BITCOIN_NETWORK,
      TEST_STRINGS.SOLANA_NETWORK,
      TEST_STRINGS.TRON_NETWORK,
    ]);
  });

  describe('Copy Functionality', () => {
    beforeEach(() => {
      mockHandleCopy.mockClear();
    });

    it('copies address when clicking copy button', async () => {
      renderComponent();

      const triggerElement = screen.getByTestId(TEST_IDS.HOVER_TRIGGER);
      fireEvent.mouseEnter(triggerElement.parentElement as HTMLElement);
      await waitFor(() => {
        expect(
          screen.getByTestId(TEST_IDS.MULTICHAIN_ADDRESS_ROWS_LIST),
        ).toBeInTheDocument();
      });

      const evmRow = screen
        .getByText(TEST_STRINGS.EVM_NETWORKS)
        .closest(`[data-testid="${TEST_IDS.MULTICHAIN_ADDRESS_ROW}"]`);
      const copyButton = evmRow?.querySelector(
        '[aria-label*="copy"]',
      ) as HTMLElement;

      fireEvent.click(copyButton);

      expect(mockHandleCopy).toHaveBeenCalledTimes(1);
      expect(mockHandleCopy).toHaveBeenCalledWith(
        '0x4B42aED7d99fC7874A56E6003629c89210A31C34',
      );
    });

    it('copies address when clicking on the row (not button)', async () => {
      renderComponent();

      const triggerElement = screen.getByTestId(TEST_IDS.HOVER_TRIGGER);
      fireEvent.mouseEnter(triggerElement.parentElement as HTMLElement);
      await waitFor(() => {
        expect(
          screen.getByTestId(TEST_IDS.MULTICHAIN_ADDRESS_ROWS_LIST),
        ).toBeInTheDocument();
      });

      const networkNameElement = screen.getByText(TEST_STRINGS.EVM_NETWORKS);

      fireEvent.click(networkNameElement);

      expect(mockHandleCopy).toHaveBeenCalledTimes(1);
      expect(mockHandleCopy).toHaveBeenCalledWith(
        '0x4B42aED7d99fC7874A56E6003629c89210A31C34',
      );
    });
  });

  describe('View All Button', () => {
    it('renders the View All button', async () => {
      renderComponent();

      const triggerElement = screen.getByTestId(TEST_IDS.HOVER_TRIGGER);
      fireEvent.mouseEnter(triggerElement.parentElement as HTMLElement);
      await waitFor(() => {
        expect(
          screen.getByTestId(TEST_IDS.MULTICHAIN_ADDRESS_ROWS_LIST),
        ).toBeInTheDocument();
      });

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      const viewAllButton = buttons[buttons.length - 1];
      expect(viewAllButton).toBeInTheDocument();
    });

    it('navigates to the correct route when clicked', async () => {
      renderComponent();

      const triggerElement = screen.getByTestId(TEST_IDS.HOVER_TRIGGER);
      fireEvent.mouseEnter(triggerElement.parentElement as HTMLElement);
      await waitFor(() => {
        expect(
          screen.getByTestId(TEST_IDS.MULTICHAIN_ADDRESS_ROWS_LIST),
        ).toBeInTheDocument();
      });

      const buttons = screen.getAllByRole('button');
      const viewAllButton = buttons[buttons.length - 1];

      fireEvent.click(viewAllButton);

      expect(mockUseNavigate).toHaveBeenCalledWith(
        `${MULTICHAIN_ACCOUNT_ADDRESS_LIST_PAGE_ROUTE}/${encodeURIComponent(GROUP_ID_MOCK)}`,
      );
    });

    it('navigates with properly encoded group ID', async () => {
      mockedGetAllAccountGroups.mockReturnValue([
        createMockAccountGroup(
          SPECIAL_GROUP_ID,
          WALLET_ID_MOCK,
          'Special Group',
          1,
          [ACCOUNT_EVM_ID_MOCK],
        ),
      ] as never);

      mockedSelectBalanceForAllWallets.mockReturnValue(
        createMockBalance(
          WALLET_ID_MOCK,
          SPECIAL_GROUP_ID,
          200,
          'USD',
        ) as never,
      );

      renderComponent(SPECIAL_GROUP_ID);

      const triggerElement = screen.getByTestId(TEST_IDS.HOVER_TRIGGER);
      fireEvent.mouseEnter(triggerElement.parentElement as HTMLElement);
      await waitFor(() => {
        expect(
          screen.getByTestId(TEST_IDS.MULTICHAIN_ADDRESS_ROWS_LIST),
        ).toBeInTheDocument();
      });

      const buttons = screen.getAllByRole('button');
      const viewAllButton = buttons[buttons.length - 1];

      fireEvent.click(viewAllButton);

      expect(mockUseNavigate).toHaveBeenCalledWith(
        `${MULTICHAIN_ACCOUNT_ADDRESS_LIST_PAGE_ROUTE}/${encodeURIComponent(SPECIAL_GROUP_ID)}`,
      );
    });

    it('calls onViewAllClick callback before navigation', async () => {
      const mockOnViewAllClick = jest.fn();
      renderComponent(GROUP_ID_MOCK, mockOnViewAllClick);

      const triggerElement = screen.getByTestId(TEST_IDS.HOVER_TRIGGER);
      fireEvent.mouseEnter(triggerElement.parentElement as HTMLElement);
      await waitFor(() => {
        expect(
          screen.getByTestId(TEST_IDS.MULTICHAIN_ADDRESS_ROWS_LIST),
        ).toBeInTheDocument();
      });

      const buttons = screen.getAllByRole('button');
      const viewAllButton = buttons[buttons.length - 1];

      fireEvent.click(viewAllButton);

      expect(mockOnViewAllClick).toHaveBeenCalledTimes(1);
      expect(mockUseNavigate).toHaveBeenCalledWith(
        `${MULTICHAIN_ACCOUNT_ADDRESS_LIST_PAGE_ROUTE}/${encodeURIComponent(GROUP_ID_MOCK)}`,
      );
    });
  });

  describe('Hover Functionality', () => {
    it('renders children element correctly', () => {
      renderComponent();

      expect(screen.getByTestId(TEST_IDS.HOVER_TRIGGER)).toBeInTheDocument();
      expect(screen.getByText('Hover Me')).toBeInTheDocument();
    });

    it('shows address list on hover', async () => {
      renderComponent();

      const triggerElement = screen.getByTestId(TEST_IDS.HOVER_TRIGGER);

      // Initially, the address list should not be visible
      expect(
        screen.queryByTestId(TEST_IDS.MULTICHAIN_ADDRESS_ROWS_LIST),
      ).not.toBeInTheDocument();

      // Hover over the trigger element
      fireEvent.mouseEnter(triggerElement.parentElement as HTMLElement);

      // Wait for the popover to appear
      await waitFor(() => {
        expect(
          screen.getByTestId(TEST_IDS.MULTICHAIN_ADDRESS_ROWS_LIST),
        ).toBeInTheDocument();
      });

      // Verify content is displayed
      expect(screen.getByText(TEST_STRINGS.EVM_NETWORKS)).toBeInTheDocument();
      expect(
        screen.getByText(TEST_STRINGS.BITCOIN_NETWORK),
      ).toBeInTheDocument();
    });

    it('hides address list on mouse leave with delay', async () => {
      jest.useFakeTimers();
      renderComponent();

      const triggerElement = screen.getByTestId(TEST_IDS.HOVER_TRIGGER);

      // Show the popover
      fireEvent.mouseEnter(triggerElement.parentElement as HTMLElement);

      await waitFor(() => {
        expect(
          screen.getByTestId(TEST_IDS.MULTICHAIN_ADDRESS_ROWS_LIST),
        ).toBeInTheDocument();
      });

      // Leave hover
      fireEvent.mouseLeave(triggerElement.parentElement as HTMLElement);

      // Popover should still be visible immediately after mouse leave
      expect(
        screen.getByTestId(TEST_IDS.MULTICHAIN_ADDRESS_ROWS_LIST),
      ).toBeInTheDocument();

      // Fast forward timers to trigger the hide
      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(
          screen.queryByTestId(TEST_IDS.MULTICHAIN_ADDRESS_ROWS_LIST),
        ).not.toBeInTheDocument();
      });

      jest.useRealTimers();
    });

    it('keeps popover open when hovering over it', async () => {
      jest.useFakeTimers();
      renderComponent();

      const triggerElement = screen.getByTestId(TEST_IDS.HOVER_TRIGGER);

      // Show the popover
      fireEvent.mouseEnter(triggerElement.parentElement as HTMLElement);

      await waitFor(() => {
        expect(
          screen.getByTestId(TEST_IDS.MULTICHAIN_ADDRESS_ROWS_LIST),
        ).toBeInTheDocument();
      });

      // Leave trigger element
      fireEvent.mouseLeave(triggerElement.parentElement as HTMLElement);

      // Immediately hover over the popover
      const popoverContent = screen.getByTestId(
        TEST_IDS.MULTICHAIN_ADDRESS_ROWS_LIST,
      );
      fireEvent.mouseEnter(popoverContent);

      // Fast forward timers
      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      // Popover should still be visible
      expect(
        screen.getByTestId(TEST_IDS.MULTICHAIN_ADDRESS_ROWS_LIST),
      ).toBeInTheDocument();

      jest.useRealTimers();
    });

    it('applies hover styles to trigger element', async () => {
      jest.useFakeTimers();
      renderComponent();

      const triggerElement = screen.getByTestId(TEST_IDS.HOVER_TRIGGER);
      const containerElement = triggerElement.parentElement as HTMLElement;

      // Initially the popover should not be visible
      expect(
        screen.queryByTestId(TEST_IDS.MULTICHAIN_ADDRESS_ROWS_LIST),
      ).not.toBeInTheDocument();

      // Hover over the trigger
      fireEvent.mouseEnter(containerElement);

      // Wait for popover to appear, which indicates hover state is active
      await waitFor(() => {
        expect(
          screen.getByTestId(TEST_IDS.MULTICHAIN_ADDRESS_ROWS_LIST),
        ).toBeInTheDocument();
      });

      // The component should have the hover state active
      // Since we can't directly check the inline styles in test environment,
      // we verify the behavior by checking that the popover is visible

      // Leave hover
      fireEvent.mouseLeave(containerElement);

      // Popover should still be visible immediately after mouse leave
      expect(
        screen.getByTestId(TEST_IDS.MULTICHAIN_ADDRESS_ROWS_LIST),
      ).toBeInTheDocument();

      // Fast forward time to trigger the hide
      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      // Popover should be hidden after delay
      expect(
        screen.queryByTestId(TEST_IDS.MULTICHAIN_ADDRESS_ROWS_LIST),
      ).not.toBeInTheDocument();

      jest.useRealTimers();
    });
  });
});
