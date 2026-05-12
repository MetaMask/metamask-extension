import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';

import configureStore from '../../store/store';
import mockState from '../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import {
  addTransaction,
  findNetworkClientIdByChainId,
} from '../../store/actions';
import {
  ConfirmationLoader,
  useConfirmationNavigation,
} from '../confirmations/hooks/useConfirmationNavigation';
import {
  HYPERLIQUID_DEPOSIT_CHAIN_ID,
  HYPERLIQUID_DEPOSIT_CONFIRMATION_REQUEST_ID,
  HYPERLIQUID_DEPOSIT_USDC_ADDRESS,
} from '../../../shared/lib/hyperliquid-deposit-transaction';
import HyperliquidDepositPage, {
  HYPERLIQUID_DEPOSIT_DEFAULT_AMOUNT_USDC,
} from './hyperliquid-deposit';

jest.mock('../../store/actions', () => ({
  addTransaction: jest.fn(),
  findNetworkClientIdByChainId: jest.fn(),
}));

jest.mock('../confirmations/hooks/useConfirmationNavigation', () => {
  const actual = jest.requireActual(
    '../confirmations/hooks/useConfirmationNavigation',
  );
  return {
    ...actual,
    useConfirmationNavigation: jest.fn(),
  };
});

const addTransactionMock = jest.mocked(addTransaction);
const findNetworkClientIdByChainIdMock = jest.mocked(
  findNetworkClientIdByChainId,
);
const useConfirmationNavigationMock = jest.mocked(useConfirmationNavigation);

const MOCK_NETWORK_CLIENT_ID = 'arbitrum-mainnet';
const MOCK_TX_ID = 'hyperliquid-deposit-tx-id';

function renderPage(route = '/hyperliquid-deposit', state = mockState) {
  return renderWithProvider(
    <HyperliquidDepositPage />,
    configureStore(state),
    route,
  );
}

function renderStatusPage(status: TransactionStatus) {
  return renderPage('/hyperliquid-deposit?step=status&txId=status-tx-id', {
    ...mockState,
    metamask: {
      ...mockState.metamask,
      transactions: [
        ...mockState.metamask.transactions,
        {
          id: 'status-tx-id',
          status,
          time: Date.now(),
        },
      ],
    },
  });
}

describe('HyperliquidDepositPage', () => {
  const navigateToTransactionMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    findNetworkClientIdByChainIdMock.mockResolvedValue(
      MOCK_NETWORK_CLIENT_ID as never,
    );
    addTransactionMock.mockResolvedValue({ id: MOCK_TX_ID } as never);
    useConfirmationNavigationMock.mockReturnValue({
      navigateToTransaction: navigateToTransactionMock,
    } as never);
  });

  it('starts on the intro screen without creating a transaction', () => {
    renderPage();

    expect(
      screen.getByRole('heading', { name: 'Deposit to Hyperliquid' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Review deposit')).toBeInTheDocument();
    expect(
      screen.queryByLabelText('Deposit amount in USDC'),
    ).not.toBeInTheDocument();
    expect(addTransactionMock).not.toHaveBeenCalled();
  });

  it('creates a Hyperliquid deposit transaction and opens the MetaMask confirmation', async () => {
    renderPage();

    fireEvent.click(screen.getByTestId('hyperliquid-deposit-intro-button'));

    await waitFor(() => {
      expect(addTransactionMock).toHaveBeenCalledTimes(1);
    });

    expect(findNetworkClientIdByChainIdMock).toHaveBeenCalledWith(
      HYPERLIQUID_DEPOSIT_CHAIN_ID,
    );
    expect(addTransactionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.any(String),
        to: HYPERLIQUID_DEPOSIT_USDC_ADDRESS,
        value: '0x0',
      }),
      {
        networkClientId: MOCK_NETWORK_CLIENT_ID,
        requestId: HYPERLIQUID_DEPOSIT_CONFIRMATION_REQUEST_ID,
        requireApproval: true,
        type: TransactionType.perpsDeposit,
      },
    );
    expect(addTransactionMock.mock.calls[0][0].data).toContain('05f5e100');
    expect(HYPERLIQUID_DEPOSIT_DEFAULT_AMOUNT_USDC).toBe('100');
    expect(navigateToTransactionMock).toHaveBeenCalledWith(MOCK_TX_ID, {
      goBackTo: '/hyperliquid-deposit?step=status&txId=hyperliquid-deposit-tx-id',
      loader: ConfirmationLoader.CustomAmount,
    });
  });

  it('shows a pending status before the deposit transaction confirms', () => {
    renderStatusPage(TransactionStatus.submitted);

    expect(screen.getByText('Deposit Submitted')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Your Arbitrum transaction is pending. We will mark this funded once it confirms.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText('Wallet Funded')).not.toBeInTheDocument();
    expect(screen.getByText('View activity')).toBeInTheDocument();
  });

  it('shows the funded status after the deposit transaction confirms', () => {
    renderStatusPage(TransactionStatus.confirmed);

    expect(screen.getByText('Wallet Funded')).toBeInTheDocument();
    expect(
      screen.getByText('Your perps wallet is ready to trade on Hyperliquid.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Total balance')).not.toBeInTheDocument();
    expect(screen.getByText('Trade Perps on MetaMask')).toBeInTheDocument();
  });

  it('shows a failed status when the deposit transaction fails', () => {
    renderStatusPage(TransactionStatus.failed);

    expect(screen.getByText('Deposit Failed')).toBeInTheDocument();
    expect(
      screen.getByText(
        'The transaction did not complete. Review activity for details.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Review activity')).toBeInTheDocument();
  });

  it('shows an error if creating the confirmation fails', async () => {
    addTransactionMock.mockRejectedValue(new Error('failed'));
    renderPage();

    fireEvent.click(screen.getByTestId('hyperliquid-deposit-intro-button'));

    expect(await screen.findByText('failed')).toBeInTheDocument();
    expect(navigateToTransactionMock).not.toHaveBeenCalled();
  });
});
