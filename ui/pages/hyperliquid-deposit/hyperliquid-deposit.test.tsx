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
import { usePerpsLiveAccount } from '../../hooks/perps/stream';
import {
  HYPERLIQUID_DEPOSIT_CHAIN_ID,
  HYPERLIQUID_DEPOSIT_CONFIRMATION_REQUEST_ID,
  HYPERLIQUID_DEPOSIT_USDC_ADDRESS,
} from '../../../shared/lib/hyperliquid-deposit-transaction';
import {
  CONFIRM_TRANSACTION_ROUTE,
  HYPERLIQUID_DEPOSIT_ROUTE,
} from '../../helpers/constants/routes';
import HyperliquidDepositPage, {
  HYPERLIQUID_DEPOSIT_DEFAULT_AMOUNT_USDC,
} from './hyperliquid-deposit';

jest.mock('../../store/actions', () => ({
  addTransaction: jest.fn(),
  findNetworkClientIdByChainId: jest.fn(),
}));

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

jest.mock('../../hooks/perps/stream', () => ({
  usePerpsLiveAccount: jest.fn(),
}));

const addTransactionMock = jest.mocked(addTransaction);
const findNetworkClientIdByChainIdMock = jest.mocked(
  findNetworkClientIdByChainId,
);
const usePerpsLiveAccountMock = jest.mocked(usePerpsLiveAccount);

const MOCK_NETWORK_CLIENT_ID = 'arbitrum-mainnet';
const MOCK_TX_ID = 'hyperliquid-deposit-tx-id';

function getExpectedDepositConfirmationRoute(transactionId: string) {
  const searchParams = new URLSearchParams({
    loader: 'customAmount',
    goBackTo: `${HYPERLIQUID_DEPOSIT_ROUTE}?step=status&txId=${transactionId}`,
  });

  return {
    pathname: `${CONFIRM_TRANSACTION_ROUTE}/${transactionId}`,
    search: searchParams.toString(),
  };
}

function renderPage(
  route = '/hyperliquid-deposit',
  state: Record<string, unknown> = mockState,
) {
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
  beforeEach(() => {
    jest.clearAllMocks();

    findNetworkClientIdByChainIdMock.mockResolvedValue(
      MOCK_NETWORK_CLIENT_ID as never,
    );
    addTransactionMock.mockResolvedValue({ id: MOCK_TX_ID } as never);
    usePerpsLiveAccountMock.mockReturnValue({
      account: null,
      isInitialLoading: false,
    });
  });

  it('starts on the intro screen without creating a transaction', () => {
    renderPage();

    expect(
      screen.getByRole('heading', {
        name: 'Deposit to Hyperliquid from any token',
      }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('metamask-deposit-logo')).toHaveAttribute(
      'src',
      './images/logo/metamask-fox.svg',
    );
    expect(
      screen.getByTestId('hyperliquid-deposit-logo-separator'),
    ).toHaveTextContent('×');
    expect(screen.getByTestId('hyperliquid-deposit-logo')).toHaveAttribute(
      'src',
      './images/hyperliquid-logo.svg',
    );
    expect(
      screen.getByText(
        'Hyperliquid requires USDC on Arbitrum. With MetaMask, use any token to fund your perps wallet with 1 click.',
      ),
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
    expect(mockNavigate).toHaveBeenCalledWith(
      getExpectedDepositConfirmationRoute(MOCK_TX_ID),
    );
  });

  it('shows a pending status before the deposit transaction confirms', () => {
    renderStatusPage(TransactionStatus.submitted);

    expect(screen.getByText('Deposit Pending')).toBeInTheDocument();
    expect(
      screen.getByText(
        "Your deposit is on its way. We'll update this screen once the funds are available in Hyperliquid.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText('Wallet Funded')).not.toBeInTheDocument();
    expect(
      screen.getByRole('status', { name: 'Waiting for confirmation' }),
    ).toBeInTheDocument();
    expect(screen.getByText('View activity')).toBeInTheDocument();
  });

  it('shows the funded status after the deposit transaction confirms', () => {
    usePerpsLiveAccountMock.mockReturnValue({
      account: { totalBalance: '1234.56' } as never,
      isInitialLoading: false,
    });
    renderStatusPage(TransactionStatus.confirmed);

    expect(screen.getByText('Wallet Funded')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Your perps wallet is ready to trade on Hyperliquid.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Current balance')).toBeInTheDocument();
    expect(screen.getByText('$1,234.56')).toBeInTheDocument();
    expect(screen.getByText('Trade Perps on MetaMask')).toBeInTheDocument();
  });

  it('shows a loading balance row while the Perps balance is loading', () => {
    usePerpsLiveAccountMock.mockReturnValue({
      account: null,
      isInitialLoading: true,
    });

    renderStatusPage(TransactionStatus.confirmed);

    expect(screen.getByText('Current balance')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('does not show cached zero as the final confirmed balance', () => {
    usePerpsLiveAccountMock.mockReturnValue({
      account: { totalBalance: '0' } as never,
      isInitialLoading: false,
    });

    renderStatusPage(TransactionStatus.confirmed);

    expect(screen.getByText('Current balance')).toBeInTheDocument();
    expect(screen.getByText('Updating...')).toBeInTheDocument();
    expect(screen.queryByText('$0')).not.toBeInTheDocument();
    expect(screen.queryByText('$0.00')).not.toBeInTheDocument();
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
    expect(
      screen.queryByTestId('hyperliquid-deposit-balance-row'),
    ).not.toBeInTheDocument();
  });

  it('shows an error if creating the confirmation fails', async () => {
    addTransactionMock.mockRejectedValue(new Error('failed'));
    renderPage();

    fireEvent.click(screen.getByTestId('hyperliquid-deposit-intro-button'));

    expect(await screen.findByText('failed')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
