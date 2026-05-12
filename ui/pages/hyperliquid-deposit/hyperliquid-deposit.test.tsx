import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { TransactionType } from '@metamask/transaction-controller';

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

function renderPage(state = mockState) {
  return renderWithProvider(
    <HyperliquidDepositPage />,
    configureStore(state),
    '/hyperliquid-deposit',
  );
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

  it('creates a Hyperliquid perps deposit transaction and navigates to confirmation on mount', async () => {
    renderPage();

    expect(
      screen.getByRole('heading', {
        name: 'Preparing Hyperliquid deposit confirmation',
      }),
    ).toBeInTheDocument();

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
      loader: ConfirmationLoader.CustomAmount,
    });
  });

  it('shows an error if creating the confirmation fails', async () => {
    addTransactionMock.mockRejectedValue(new Error('failed'));

    renderPage();

    expect(await screen.findByText('failed')).toBeInTheDocument();
    expect(navigateToTransactionMock).not.toHaveBeenCalled();
  });
});
