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

describe('PerpsDepositToast', () => {
  const submitRequestToBackgroundMock = jest.mocked(submitRequestToBackground);

  beforeEach(() => {
    submitRequestToBackgroundMock.mockResolvedValue(undefined);
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('dismisses and does not show a toast when there is no deposit state', () => {
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
        transactions: [],
        lastDepositResult: null,
      },
    });

    renderWithProvider(<PerpsDepositToast />, store);

    expect(mockToastDismiss).toHaveBeenCalledWith('perps-deposit-toast');
    expect(mockToastLoading).not.toHaveBeenCalled();
    expect(mockToastSuccess).not.toHaveBeenCalled();
    expect(mockToastError).not.toHaveBeenCalled();
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

  it('renders pending toast for token-funded deposits', () => {
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
  });

  it('renders success toast when the deposit transaction is no longer active', () => {
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
        transactions: [],
        lastDepositTransactionId: null,
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
  });

  it('clears deposit result when completion toast duration elapses', () => {
    jest.useFakeTimers();
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

    expect(submitRequestToBackgroundMock).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(submitRequestToBackgroundMock).toHaveBeenCalledWith(
      'perpsClearDepositResult',
      [],
    );
  });

  it('does not clear deposit result when completion toast rerenders before the duration elapses', () => {
    jest.useFakeTimers();
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

    act(() => {
      store.dispatch({
        type: 'UPDATE_METAMASK_STATE',
        value: {
          lastDepositResult: {
            success: true,
            error: 'same result re-render',
            timestamp: 1_700_000_000_000,
          },
        },
      });
    });

    expect(submitRequestToBackgroundMock).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(4999);
    });

    expect(submitRequestToBackgroundMock).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(submitRequestToBackgroundMock).toHaveBeenCalledTimes(1);
    expect(submitRequestToBackgroundMock).toHaveBeenCalledWith(
      'perpsClearDepositResult',
      [],
    );
  });

  it('dismisses the completion toast without clearing deposit result when unmounted before duration elapses', () => {
    jest.useFakeTimers();
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

    const { unmount } = renderWithProvider(<PerpsDepositToast />, store);

    expect(submitRequestToBackgroundMock).not.toHaveBeenCalled();

    unmount();

    expect(mockToastDismiss).toHaveBeenCalledWith('perps-deposit-toast');
    expect(submitRequestToBackgroundMock).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(submitRequestToBackgroundMock).not.toHaveBeenCalled();
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
          error: messages.perpsDepositErrorBridgeFailed.message,
        },
      },
    });

    renderWithProvider(<PerpsDepositToast />, store);

    expect(mockToastError).toHaveBeenCalledWith(
      expect.objectContaining({
        props: expect.objectContaining({
          title: messages.perpsDepositToastErrorTitle.message,
          description: messages.perpsDepositErrorBridgeFailed.message,
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
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
        transactions: [
          buildPendingDepositTransaction({
            id: 'submitted-tx-1',
            status: TransactionStatus.submitted,
          }),
        ],
        lastDepositTransactionId: 'submitted-tx-1',
      },
    });

    renderWithProvider(<PerpsDepositToast />, store);

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

  it('shows completion toast for token-funded deposits', () => {
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
