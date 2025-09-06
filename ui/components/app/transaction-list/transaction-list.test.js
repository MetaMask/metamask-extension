import React from 'react';
import { fireEvent } from '@testing-library/react';
import { TransactionType } from '@metamask/transaction-controller';
import { renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import {
  MOCK_ACCOUNT_BIP122_P2WPKH,
  MOCK_ACCOUNT_SOLANA_MAINNET,
} from '../../../../test/data/mock-accounts';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventLinkType,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import {
  MULTICHAIN_NETWORK_BLOCK_EXPLORER_FORMAT_URLS_MAP,
  MultichainNetworks,
} from '../../../../shared/constants/multichain/networks';
import { formatBlockExplorerAddressUrl } from '../../../../shared/lib/multichain/networks';
import { MOCK_TRANSACTION_BY_TYPE } from '../../../../.storybook/initial-states/transactions';
import { createMockInternalAccount } from '../../../../test/jest/mocks';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import TransactionList, {
  filterTransactionsByToken,
} from './transaction-list.component';

const MOCK_INTERNAL_ACCOUNT = createMockInternalAccount({
  address: '0xefga64466f257793eaa52fcfff5066894b76a149',
  id: 'id-account',
});

const defaultState = {
  metamask: {
    ...mockState.metamask,
    enabledNetworkMap: {
      [CHAIN_IDS.GOERLI]: true,
    },
    transactions: [MOCK_TRANSACTION_BY_TYPE[TransactionType.incoming]],
    internalAccounts: {
      accounts: { [MOCK_INTERNAL_ACCOUNT.id]: MOCK_INTERNAL_ACCOUNT },
      selectedAccount: MOCK_INTERNAL_ACCOUNT.id,
    },
  },
};

const btcState = {
  metamask: {
    ...mockState.metamask,
    nonEvmTransactions: {
      [MOCK_ACCOUNT_BIP122_P2WPKH.id]: {
        [MultichainNetworks.BITCOIN]: {
          transactions: [
            {
              timestamp: 1733736433,
              chain: MultichainNetworks.BITCOIN,
              status: 'confirmed',
              type: 'send',
              account: MOCK_ACCOUNT_BIP122_P2WPKH.id,
              from: [],
              to: [
                {
                  address: MOCK_ACCOUNT_BIP122_P2WPKH.address,
                  asset: {
                    fungible: true,
                    type: '',
                    unit: 'BTC',
                    amount: '1.1',
                  },
                },
                {
                  address: MOCK_ACCOUNT_BIP122_P2WPKH.address,
                  asset: {
                    fungible: true,
                    type: '',
                    unit: 'BTC',
                    amount: '0.1',
                  },
                },
              ],
              fees: [],
              events: [],
            },
          ],
          next: null,
          lastUpdated: expect.any(Number),
        },
      },
    },
    internalAccounts: {
      ...mockState.metamask.internalAccounts,
      accounts: {
        ...mockState.metamask.internalAccounts.accounts,
        [MOCK_ACCOUNT_BIP122_P2WPKH.id]: MOCK_ACCOUNT_BIP122_P2WPKH,
      },
      selectedAccount: MOCK_ACCOUNT_BIP122_P2WPKH.id,
    },
    selectedAddress: MOCK_ACCOUNT_BIP122_P2WPKH.address,
    completedOnboarding: true,
    transactions: [],
  },
};

const solanaSwapState = {
  metamask: {
    ...mockState.metamask,
    nonEvmTransactions: {
      [MOCK_ACCOUNT_SOLANA_MAINNET.id]: {
        [MultichainNetworks.SOLANA]: {
          transactions: [
            {
              id: '2pfnv4drhnitfzCFKxiRoJMzFQpG7wZ9mpRQVk7xm5TQ27g6FZH95HVF6KgwQBS872yGtyhuq57jXXS1y29ub11',
              timestamp: 1740480781,
              chain: MultichainNetworks.SOLANA,
              status: 'confirmed',
              type: 'swap',
              from: [
                {
                  address: MOCK_ACCOUNT_SOLANA_MAINNET.address,
                  asset: {
                    fungible: true,
                    type: 'solCaip19',
                    unit: 'SOL',
                    amount: '0.01',
                  },
                },
              ],
              to: [
                {
                  address: MOCK_ACCOUNT_SOLANA_MAINNET.address,
                  asset: {
                    fungible: true,
                    type: 'bonkCaip19',
                    unit: 'BONK',
                    amount: '0.00000001', // Test extremely small amounts
                  },
                },
              ],
              fees: [
                {
                  type: 'base',
                  asset: {
                    fungible: true,
                    type: '',
                    unit: 'SOL',
                    amount: '0.000005',
                  },
                },
                {
                  type: 'priority',
                  asset: {
                    fungible: true,
                    type: '',
                    unit: 'SOL',
                    amount: '0.000069798',
                  },
                },
              ],
              events: [{ status: 'confirmed', timestamp: 1740480781 }],
            },
          ],
          next: null,
          lastUpdated: expect.any(Number),
        },
      },
    },
    internalAccounts: {
      ...mockState.metamask.internalAccounts,
      accounts: {
        ...mockState.metamask.internalAccounts.accounts,
        [MOCK_ACCOUNT_SOLANA_MAINNET.id]: MOCK_ACCOUNT_SOLANA_MAINNET,
      },
      selectedAccount: MOCK_ACCOUNT_SOLANA_MAINNET.id,
    },
    selectedAddress: MOCK_ACCOUNT_SOLANA_MAINNET.address,
    completedOnboarding: true,
    transactions: [],
    selectedMultichainNetworkChainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
  },
};

const mockTrackEvent = jest.fn();

const render = (state = defaultState) => {
  const store = configureStore(state);
  return renderWithProvider(
    <MetaMetricsContext.Provider value={mockTrackEvent}>
      <TransactionList />
    </MetaMetricsContext.Provider>,
    store,
  );
};

describe('TransactionList', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders TransactionList component correctly', () => {
    const { container } = render();
    expect(container).toMatchSnapshot();
  });

  it('renders TransactionList component with props hideNetworkFilter correctly', () => {
    const store = configureStore(defaultState);
    const { container } = renderWithProvider(
      <MetaMetricsContext.Provider value={mockTrackEvent}>
        <TransactionList hideNetworkFilter />
      </MetaMetricsContext.Provider>,
      store,
    );
    expect(container).toMatchSnapshot();
  });

  it('renders TransactionList component with props hideTokenTransactions correctly', () => {
    const defaultState2 = {
      ...defaultState,
      metamask: {
        ...defaultState.metamask,
        transactions: [MOCK_TRANSACTION_BY_TYPE[TransactionType.swap]],
      },
    };
    const store = configureStore(defaultState2);
    const { container } = renderWithProvider(
      <MetaMetricsContext.Provider value={mockTrackEvent}>
        <TransactionList hideTokenTransactions />
      </MetaMetricsContext.Provider>,
      store,
    );
    expect(container).toMatchSnapshot();
  });

  it('renders TransactionList component and does not show You have no transactions text', () => {
    const { queryByText } = render();
    expect(queryByText('You have no transactions')).toBeNull();
  });

  it('renders TransactionList component and shows a Bitcoin Tx in the activity list', () => {
    const { getByText, getByRole, getByTestId } = render(btcState);

    // The activity list item has a status of "Confirmed" and a type of "Send"
    expect(getByText('Confirmed')).toBeInTheDocument();
    expect(getByText('Sent')).toBeInTheDocument();
    expect(getByText('-1.2 BTC')).toBeInTheDocument();

    // A BTC activity list item exists
    expect(getByTestId('activity-list-item')).toBeInTheDocument();

    const viewOnExplorerBtn = getByRole('button', {
      name: 'View on block explorer',
    });
    expect(viewOnExplorerBtn).toBeInTheDocument();

    const blockExplorerUrl = formatBlockExplorerAddressUrl(
      MULTICHAIN_NETWORK_BLOCK_EXPLORER_FORMAT_URLS_MAP[
        MultichainNetworks.BITCOIN
      ],
      btcState.metamask.internalAccounts.selectedAccount.address,
    );
    const blockExplorerDomain = new URL(blockExplorerUrl).host;
    fireEvent.click(viewOnExplorerBtn);
    expect(mockTrackEvent).toHaveBeenCalledWith({
      event: MetaMetricsEventName.ExternalLinkClicked,
      category: MetaMetricsEventCategory.Navigation,
      properties: {
        link_type: MetaMetricsEventLinkType.AccountTracker,
        location: 'Activity Tab',
        url_domain: blockExplorerDomain,
      },
    });
  });

  it('renders TransactionList component and does not show Chain ID mismatch text if network name is not available', () => {
    const store = configureStore(defaultState);

    const { queryByText } = renderWithProvider(
      <MetaMetricsContext.Provider value={mockTrackEvent}>
        <TransactionList tokenChainId="0x89" />
      </MetaMetricsContext.Provider>,
      store,
    );
    expect(
      queryByText('Please switch network to view transactions'),
    ).toBeNull();
  });

  it('renders TransactionList component and shows network name text', () => {
    const defaultState2 = {
      metamask: {
        ...mockState.metamask,
        selectedNetworkClientId: 'mainnet',
        networkConfigurationsByChainId: {
          '0x1': {
            blockExplorerUrls: [],
            chainId: '0x1',
            defaultRpcEndpointIndex: 0,
            name: 'Mainnet',
            nativeCurrency: 'ETH',
            rpcEndpoints: [
              {
                networkClientId: 'mainnet',
                type: 'infura',
                url: 'https://mainnet.infura.io/v3/{infuraProjectId}',
              },
            ],
          },
          '0xe708': {
            blockExplorerUrls: [],
            chainId: '0xe708',
            defaultRpcEndpointIndex: 0,
            name: 'Linea Mainnet',
            nativeCurrency: 'ETH',
            rpcEndpoints: [
              {
                networkClientId: 'linea-mainnet',
                type: 'infura',
                url: 'https://linea-mainnet.infura.io/v3/{infuraProjectId}',
              },
            ],
          },
        },
        transactions: [],
      },
    };
    const store = configureStore(defaultState2);

    const { queryByText } = renderWithProvider(
      <MetaMetricsContext.Provider value={mockTrackEvent}>
        <TransactionList tokenChainId="0xe708" />
      </MetaMetricsContext.Provider>,
      store,
    );
    expect(
      queryByText(
        'Please switch to Linea Mainnet network to view transactions',
      ),
    ).toBeNull();
  });

  it('renders TransactionList component and shows a Solana Swap Tx in the activity list', () => {
    const { getByText, getByRole, getByTestId } = render(solanaSwapState);

    expect(getByText('Confirmed')).toBeInTheDocument();
    expect(getByText('Swap SOL to BONK')).toBeInTheDocument();

    expect(getByTestId('activity-list-item')).toBeInTheDocument();

    expect(getByText('-0.01 SOL')).toBeInTheDocument();

    const viewOnExplorerBtn = getByRole('button', {
      name: 'View on block explorer',
    });
    expect(viewOnExplorerBtn).toBeInTheDocument();
  });

  describe('keepOnlyNonEvmTransactionsForToken', () => {
    const transactionWithSolAndToken = {
      from: [
        {
          asset: {
            type: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
          },
        },
      ],
      to: [
        {
          asset: {
            type: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
          },
        },
        {
          asset: {
            type: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          },
        },
      ],
    };
    const transactionWithOnlySol = {
      from: [
        {
          asset: {
            type: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
          },
        },
      ],
      to: [
        {
          asset: {
            type: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
          },
        },
      ],
    };
    const transactionWithOnlyToken = {
      from: [
        {
          asset: {
            type: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          },
        },
      ],
      to: [
        {
          asset: {
            type: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          },
        },
      ],
    };

    const nonEvmTransactions = {
      [MOCK_ACCOUNT_SOLANA_MAINNET.id]: {
        [MultichainNetworks.SOLANA]: {
          transactions: [
            transactionWithSolAndToken,
            transactionWithOnlySol,
            transactionWithOnlyToken,
          ],
          next: null,
          lastUpdated: expect.any(Number),
        },
      },
    };

    it('filters out transactions that do not involve the token address', () => {
      const tokenAddress =
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

      const result = filterTransactionsByToken(
        nonEvmTransactions[MOCK_ACCOUNT_SOLANA_MAINNET.id][
          MultichainNetworks.SOLANA
        ],
        tokenAddress,
      );

      expect(result).toStrictEqual({
        transactions: [transactionWithSolAndToken, transactionWithOnlyToken],
        next: null,
        lastUpdated: expect.any(Number),
      });
    });

    it('returns the original object if no token address is provided', () => {
      const tokenAddress = undefined;

      const result = filterTransactionsByToken(
        nonEvmTransactions[MOCK_ACCOUNT_SOLANA_MAINNET.id][
          MultichainNetworks.SOLANA
        ],
        tokenAddress,
      );

      expect(result).toStrictEqual({
        transactions: [
          transactionWithSolAndToken,
          transactionWithOnlySol,
          transactionWithOnlyToken,
        ],
        next: null,
        lastUpdated: expect.any(Number),
      });
    });
  });
});
