import React from 'react';
import { act } from '@testing-library/react';
import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { submitRequestToBackground } from '../../../store/background-connection';
import { PerpsDepositToast } from './perps-deposit-toast';

const mockToastDismiss = jest.fn();
const mockToastError = jest.fn();
const mockToastLoading = jest.fn();
const mockToastSuccess = jest.fn();

jest.mock('../../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn(),
}));

jest.mock('../../ui/toast/toast', () => ({
  toast: {
    dismiss: (...args: unknown[]) => mockToastDismiss(...args),
    error: (...args: unknown[]) => mockToastError(...args),
    loading: (...args: unknown[]) => mockToastLoading(...args),
    success: (...args: unknown[]) => mockToastSuccess(...args),
  },
}));

function buildPendingDepositTransaction(
  overrides: {
    id?: string;
    type?: TransactionType;
    status?: TransactionStatus;
  } = {},
) {
  return {
    id: overrides.id ?? 'pending-tx-1',
    time: 1_700_000_000_000,
    chainId: '0xa4b1',
    type: overrides.type ?? TransactionType.perpsDeposit,
    status: overrides.status ?? TransactionStatus.approved,
    txParams: { from: '0x0' },
  };
}

const renderPerpsDepositToast = ({
  transactions = [],
  lastDepositTransactionId = null,
  lastDepositResult = null,
  transactionData = {},
}: {
  transactions?: ReturnType<typeof buildPendingDepositTransaction>[];
  lastDepositTransactionId?: string | null;
  lastDepositResult?: {
    success: boolean;
    error?: string;
    timestamp?: number;
  } | null;
  transactionData?: Record<string, unknown>;
}) => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
      transactions,
      lastDepositTransactionId,
      lastDepositResult,
      transactionData,
    },
  });

  return {
    store,
    ...renderWithProvider(<PerpsDepositToast />, store),
  };
};

describe('PerpsDepositToast', () => {
  const submitRequestToBackgroundMock = jest.mocked(submitRequestToBackground);

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    submitRequestToBackgroundMock.mockResolvedValue(undefined);
  });

  it('renders nothing when there is no deposit state', () => {
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
        transactions: [],
        lastDepositResult: null,
      },
    });

    renderWithProvider(<PerpsDepositToast />, store);

    expect(mockToastLoading).not.toHaveBeenCalled();
    expect(mockToastSuccess).not.toHaveBeenCalled();
    expect(mockToastError).not.toHaveBeenCalled();
  });

  it('renders a pending toast when a native-token-funded deposit is pending', () => {
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
        transactions: [buildPendingDepositTransaction()],
        lastDepositTransactionId: 'pending-tx-1',
      },
    });

    renderWithProvider(<PerpsDepositToast />, store);

    expect(mockToastLoading).toHaveBeenCalledWith(
      expect.objectContaining({
        props: expect.objectContaining({
          title: messages.perpsDepositToastPendingTitle.message,
          description: messages.perpsDepositToastPendingDescription.message,
        }),
      }),
      {
        id: 'perps-deposit-toast',
        duration: Infinity,
      },
    );
  });

  it('does not show pending toast for token-funded deposits', () => {
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
        transactions: [
          buildPendingDepositTransaction({
            id: 'pending-tx-1',
            type: TransactionType.perpsDeposit,
          }),
        ],
        lastDepositTransactionId: 'pending-tx-1',
        lastDepositResult: null,
        transactionData: {
          'pending-tx-1': {
            paymentToken: {
              address: '0x00000000000000000000000000000000000000dA',
              chainId: '0xa4b1',
            },
          },
        },
      },
    });

    renderWithProvider(<PerpsDepositToast />, store);

    expect(mockToastLoading).not.toHaveBeenCalled();
  });

  it('shows a success toast and clears the deposit result', () => {
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
        transactions: [
          buildPendingDepositTransaction({
            id: 'result-tx-1',
            status: TransactionStatus.confirmed,
          }),
        ],
        lastDepositTransactionId: 'result-tx-1',
        lastDepositResult: {
          success: true,
          error: '',
          timestamp: 1_700_000_000_000,
        },
      },
    });

    renderWithProvider(<PerpsDepositToast />, store);

    expect(mockToastSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        props: expect.objectContaining({
          title: messages.perpsDepositToastSuccessTitle.message,
          description: messages.perpsDepositToastSuccessDescription.message,
        }),
      }),
      {
        id: 'perps-deposit-toast',
        duration: 5000,
      },
    );
    expect(submitRequestToBackgroundMock).toHaveBeenCalledWith(
      'perpsClearDepositResult',
      [],
    );
  });

  it('shows an error toast using the deposit result error', () => {
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
        transactions: [
          buildPendingDepositTransaction({
            id: 'result-tx-1',
            status: TransactionStatus.confirmed,
          }),
        ],
        lastDepositTransactionId: 'result-tx-1',
        lastDepositResult: {
          success: false,
          error: 'Bridge failed',
          timestamp: 1_700_000_000_000,
        },
      },
    });

    renderWithProvider(<PerpsDepositToast />, store);

    expect(mockToastError).toHaveBeenCalledWith(
      expect.objectContaining({
        props: expect.objectContaining({
          title: messages.perpsDepositToastErrorTitle.message,
          description: 'Bridge failed',
        }),
      }),
      {
        id: 'perps-deposit-toast',
        duration: 5000,
      },
    );
  });

  it('replaces pending toast with completion toast when the result arrives', () => {
    const { store } = renderPerpsDepositToast({
      transactions: [
        buildPendingDepositTransaction({
          id: 'submitted-tx-1',
          status: TransactionStatus.submitted,
        }),
      ],
      lastDepositTransactionId: 'submitted-tx-1',
    });

    expect(mockToastLoading).toHaveBeenCalledTimes(1);

    act(() => {
      store.dispatch({
        type: 'UPDATE_METAMASK_STATE',
        value: {
          transactions: [
            buildPendingDepositTransaction({
              id: 'submitted-tx-1',
              status: TransactionStatus.confirmed,
            }),
          ],
          lastDepositTransactionId: 'submitted-tx-1',
          lastDepositResult: {
            success: true,
            error: '',
            timestamp: 1_700_000_000_000,
          },
        },
      });
    });

    expect(mockToastSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        props: expect.objectContaining({
          title: messages.perpsDepositToastSuccessTitle.message,
        }),
      }),
      {
        id: 'perps-deposit-toast',
        duration: 5000,
      },
    );
  });

  it('does not show completion toast for token-funded deposits', () => {
    renderPerpsDepositToast({
      transactions: [
        buildPendingDepositTransaction({
          id: 'submitted-tx-1',
          status: TransactionStatus.confirmed,
        }),
      ],
      lastDepositTransactionId: 'submitted-tx-1',
      lastDepositResult: {
        success: true,
        error: '',
        timestamp: 1_700_000_000_000,
      },
      transactionData: {
        'submitted-tx-1': {
          paymentToken: {
            address: '0x00000000000000000000000000000000000000dA',
            chainId: '0xa4b1',
          },
        },
      },
    });

    expect(mockToastSuccess).not.toHaveBeenCalled();
  });

  it('does not repeat a pending toast for the same transaction ID', () => {
    const { rerender } = renderPerpsDepositToast({
      transactions: [buildPendingDepositTransaction()],
      lastDepositTransactionId: 'pending-tx-1',
    });

    rerender(<PerpsDepositToast />);

    expect(mockToastLoading).toHaveBeenCalledTimes(1);
  });
});
