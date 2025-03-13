import React from 'react';
import { fireEvent } from '@testing-library/react';
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
import TransactionList from './transaction-list.component';

const defaultState = {
  metamask: {
    ...mockState.metamask,
    transactions: [],
  },
};

const btcState = {
  metamask: {
    ...mockState.metamask,
    nonEvmTransactions: {
      [MOCK_ACCOUNT_BIP122_P2WPKH.id]: {
        transactions: [
          {
            timestamp: 1733736433,
            chain: MultichainNetworks.BITCOIN,
            status: 'confirmed',
            type: 'send',
            account: MOCK_ACCOUNT_BIP122_P2WPKH.id,
            from: [],
            to: [],
            fees: [],
            events: [],
          },
        ],
        next: null,
        lastUpdated: expect.any(Number),
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
        transactions: [
          {
            id: '2pfnv4drhnitfzCFKxiRoJMzFQpG7wZ9mpRQVk7xm5TQ27g6FZH95HVF6KgwQBS872yGtyhuq57jXXS1y29ub11',
            timestamp: 1740480781,
            chain: MultichainNetworks.SOLANA,
            status: 'confirmed',
            type: 'swap',
            from: [
              {
                address: '8kR2HTHzPtTJuzpFZ8jtGCQ9TpahPaWbZfTNRs2GJdxq',
                asset: {
                  fungible: true,
                  type: '',
                  unit: 'SOL',
                  amount: '0.000073111',
                },
              },
              {
                address: MOCK_ACCOUNT_SOLANA_MAINNET.address,
                asset: {
                  fungible: true,
                  type: '',
                  unit: 'SOL',
                  amount: '0.01',
                },
              },
              {
                address: 'HUCjBnmd4FoUjCCMYQ9xFz1ce1r8vWAd8uMhUQakE2FR',
                asset: {
                  fungible: true,
                  type: '',
                  unit: 'BONK',
                  amount: '2583.728601',
                },
              },
              {
                address: '3msVd34R5KxonDzyNSV5nT19UtUeJ2RF1NaQhvVPNLxL',
                asset: {
                  fungible: true,
                  type: '',
                  unit: 'SOL',
                  amount: '0.000073111',
                },
              },
            ],
            to: [
              {
                address: 'CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM',
                asset: {
                  fungible: true,
                  type: '',
                  unit: 'SOL',
                  amount: '0.000000723',
                },
              },
              {
                address: 'HUCjBnmd4FoUjCCMYQ9xFz1ce1r8vWAd8uMhUQakE2FR',
                asset: {
                  fungible: true,
                  type: '',
                  unit: 'SOL',
                  amount: '0.00007238',
                },
              },
              {
                address: MOCK_ACCOUNT_SOLANA_MAINNET.address,
                asset: {
                  fungible: true,
                  type: '',
                  unit: 'BONK',
                  amount: '2583.72',
                },
              },
              {
                address: '3msVd34R5KxonDzyNSV5nT19UtUeJ2RF1NaQhvVPNLxL',
                asset: {
                  fungible: true,
                  type: '',
                  unit: 'SOL',
                  amount: '0.01',
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

  it('renders TransactionList component and does not show You have no transactions text', () => {
    const { queryByText } = render();
    expect(queryByText('You have no transactions')).toBeNull();
  });

  it('renders TransactionList component and shows a Bitcoin Tx in the activity list', () => {
    const { getByText, getByRole, getByTestId } = render(btcState);

    // The activity list item has a status of "Confirmed" and a type of "Send"
    expect(getByText('Confirmed')).toBeInTheDocument();
    expect(getByText('Send')).toBeInTheDocument();

    // A BTC activity list iteem exists
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
});
