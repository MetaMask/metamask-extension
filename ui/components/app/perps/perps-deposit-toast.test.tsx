import React from 'react';
import { screen, act } from '@testing-library/react';
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
  ToastContent: () => null,
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

    expect(screen.queryByTestId('perps-deposit-toast')).not.toBeInTheDocument();
  });

  it('renders pending toast when mounting with deposit already in progress', () => {
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
        transactions: [buildPendingDepositTransaction()],
        lastDepositTransactionId: 'pending-tx-1',
        lastDepositResult: null,
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

  it('does not render pending toast for token-funded deposits', () => {
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
        transactions: [buildPendingDepositTransaction()],
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

  it('renders pending toast for native-token-funded deposits', () => {
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
        transactions: [buildPendingDepositTransaction()],
        lastDepositTransactionId: 'pending-tx-1',
        lastDepositResult: null,
        transactionData: {
          'pending-tx-1': {
            paymentToken: {
              address: '0x0000000000000000000000000000000000000000',
              chainId: '0xa4b1',
            },
          },
        },
      },
    });

    renderWithProvider(<PerpsDepositToast />, store);

    expect(mockToastLoading).toHaveBeenCalled();
  });

  it('renders pending toast when mounting with deposit already in progress for perpsDepositAndOrder', () => {
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
        transactions: [
          buildPendingDepositTransaction({
            type: TransactionType.perpsDepositAndOrder,
          }),
        ],
        lastDepositTransactionId: 'pending-tx-1',
        lastDepositResult: null,
      },
    });

    renderWithProvider(<PerpsDepositToast />, store);

    expect(mockToastLoading).toHaveBeenCalled();
  });

  it('does not render the pending toast when the transaction is still unapproved', () => {
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
        transactions: [
          buildPendingDepositTransaction({
            status: TransactionStatus.unapproved,
          }),
        ],
        lastDepositTransactionId: 'pending-tx-1',
        lastDepositResult: null,
      },
    });

    renderWithProvider(<PerpsDepositToast />, store);

    expect(mockToastLoading).not.toHaveBeenCalled();
  });

  it('renders success toast when lastDepositResult is successful', () => {
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

  it('renders error toast when lastDepositResult is unsuccessful', () => {
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

  it('prefers the completion toast when a result and in-progress state coexist', () => {
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
        transactions: [buildPendingDepositTransaction()],
        lastDepositTransactionId: 'pending-tx-1',
        lastDepositResult: {
          success: true,
          error: '',
          timestamp: 1_700_000_000_000,
        },
      },
    });

    renderWithProvider(<PerpsDepositToast />, store);

    expect(mockToastSuccess).toHaveBeenCalled();
    expect(mockToastLoading).not.toHaveBeenCalled();
  });

  it('renders pending toast when a new deposit transaction ID appears', () => {
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
        transactions: [],
        lastDepositTransactionId: null,
        lastDepositResult: null,
      },
    });

    renderWithProvider(<PerpsDepositToast />, store);

    expect(mockToastLoading).not.toHaveBeenCalled();

    act(() => {
      store.dispatch({
        type: 'UPDATE_METAMASK_STATE',
        value: {
          transactions: [
            buildPendingDepositTransaction({ id: 'submitted-tx-1' }),
          ],
          lastDepositTransactionId: 'submitted-tx-1',
          lastDepositResult: null,
        },
      });
    });

    expect(mockToastLoading).toHaveBeenCalled();
  });

  it('keeps showing the pending toast after a transaction ID appears', () => {
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
        transactions: [],
        lastDepositTransactionId: null,
        lastDepositResult: null,
      },
    });

    renderWithProvider(<PerpsDepositToast />, store);

    expect(mockToastLoading).not.toHaveBeenCalled();

    act(() => {
      store.dispatch({
        type: 'UPDATE_METAMASK_STATE',
        value: {
          transactions: [
            buildPendingDepositTransaction({
              id: 'submitted-tx-1',
              status: TransactionStatus.submitted,
            }),
          ],
          lastDepositTransactionId: 'submitted-tx-1',
          lastDepositResult: null,
        },
      });
    });

    expect(mockToastLoading).toHaveBeenCalled();
  });

  it('shows completion toast when deposit result arrives', () => {
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
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
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
      },
    });

    renderWithProvider(<PerpsDepositToast />, store);

    expect(mockToastSuccess).not.toHaveBeenCalled();
  });

  it('shows pending for the active deposit only when a stale perps tx remains submitted', () => {
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
        transactions: [
          buildPendingDepositTransaction({
            id: 'stale-deposit',
            status: TransactionStatus.submitted,
          }),
          buildPendingDepositTransaction({
            id: 'current-deposit',
            status: TransactionStatus.approved,
          }),
        ],
        lastDepositTransactionId: 'current-deposit',
        lastDepositResult: null,
      },
    });

    renderWithProvider(<PerpsDepositToast />, store);

    expect(mockToastLoading).toHaveBeenCalled();
  });

  it('does not show pending when active id is confirmed even if another perps deposit stays submitted', () => {
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
        transactions: [
          buildPendingDepositTransaction({
            id: 'stale-deposit',
            status: TransactionStatus.submitted,
          }),
          buildPendingDepositTransaction({
            id: 'current-deposit',
            status: TransactionStatus.confirmed,
          }),
        ],
        lastDepositTransactionId: 'current-deposit',
        lastDepositResult: null,
      },
    });

    renderWithProvider(<PerpsDepositToast />, store);

    expect(mockToastLoading).not.toHaveBeenCalled();
  });
});
