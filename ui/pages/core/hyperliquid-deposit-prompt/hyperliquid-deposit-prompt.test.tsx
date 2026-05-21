import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { TransactionType } from '@metamask/transaction-controller';

import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import {
  addTransaction,
  findNetworkClientIdByChainId,
} from '../../../store/actions';
import {
  ConfirmationLoader,
  useConfirmationNavigation,
} from '../../confirmations/hooks/useConfirmationNavigation';
import {
  HYPERLIQUID_DEPOSIT_CHAIN_ID,
  HYPERLIQUID_DEPOSIT_CONFIRMATION_REQUEST_ID,
  HYPERLIQUID_DEPOSIT_USDC_ADDRESS,
} from '../../../../shared/lib/hyperliquid-deposit-transaction';
import {
  HYPERLIQUID_DEPOSIT_DEFAULT_AMOUNT_USDC,
  HyperliquidDepositPrompt,
} from './hyperliquid-deposit-prompt';

jest.mock('../../../store/actions', () => ({
  addTransaction: jest.fn(),
  findNetworkClientIdByChainId: jest.fn(),
}));

jest.mock('../../confirmations/hooks/useConfirmationNavigation', () => {
  const actual = jest.requireActual(
    '../../confirmations/hooks/useConfirmationNavigation',
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

function renderPrompt({
  onActionComplete = jest.fn(),
}: {
  onActionComplete?: jest.Mock;
} = {}) {
  renderWithProvider(
    <HyperliquidDepositPrompt onActionComplete={onActionComplete} />,
    configureStore(mockState),
  );

  return { onActionComplete };
}

describe('HyperliquidDepositPrompt', () => {
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

  it('renders the Hyperliquid deposit prompt copy', () => {
    renderPrompt();

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
      screen.getByText("No thanks, I'll deposit manually."),
    ).toBeInTheDocument();
  });

  it('creates a deposit transaction and resolves the prompt before opening the transaction confirmation', async () => {
    const { onActionComplete } = renderPrompt();

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
    expect(onActionComplete).toHaveBeenCalledWith({
      started: true,
      transactionId: MOCK_TX_ID,
    });
    expect(navigateToTransactionMock).toHaveBeenCalledWith(MOCK_TX_ID, {
      goBackTo: '/hyperliquid-deposit?step=status&txId=hyperliquid-deposit-tx-id',
      loader: ConfirmationLoader.CustomAmount,
    });
  });

  it('keeps the prompt open if creating the transaction fails', async () => {
    addTransactionMock.mockRejectedValue(new Error('failed'));
    const { onActionComplete } = renderPrompt();

    fireEvent.click(screen.getByTestId('hyperliquid-deposit-intro-button'));

    expect(await screen.findByText('failed')).toBeInTheDocument();
    expect(onActionComplete).not.toHaveBeenCalled();
    expect(navigateToTransactionMock).not.toHaveBeenCalled();
  });

  it('resolves the prompt as not started when closed', () => {
    const { onActionComplete } = renderPrompt();

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(onActionComplete).toHaveBeenCalledWith({ started: false });
  });

  it('resolves the prompt as suppressed when manual deposit is selected', () => {
    const { onActionComplete } = renderPrompt();

    fireEvent.click(
      screen.getByRole('button', {
        name: "No thanks, I'll deposit manually.",
      }),
    );

    expect(onActionComplete).toHaveBeenCalledWith({
      started: false,
      suppress: true,
    });
  });
});
