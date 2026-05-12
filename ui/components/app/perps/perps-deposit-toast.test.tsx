import React from 'react';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

jest.mock('../../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn(),
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
    submitRequestToBackgroundMock.mockReset();
    submitRequestToBackgroundMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
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

    expect(screen.getByTestId('perps-deposit-toast')).toBeInTheDocument();
    expect(
      screen.getByText(messages.perpsDepositToastPendingTitle.message),
    ).toBeInTheDocument();
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

    expect(screen.queryByTestId('perps-deposit-toast')).not.toBeInTheDocument();
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

    expect(
      screen.getByText(messages.perpsDepositToastPendingTitle.message),
    ).toBeInTheDocument();
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

    expect(
      screen.getByText(messages.perpsDepositToastPendingTitle.message),
    ).toBeInTheDocument();
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

    expect(screen.queryByTestId('perps-deposit-toast')).not.toBeInTheDocument();
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

    expect(screen.getByTestId('perps-deposit-toast')).toBeInTheDocument();
    expect(
      screen.getByText(messages.perpsDepositToastSuccessTitle.message),
    ).toBeInTheDocument();
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

    expect(
      screen.getByText(messages.perpsDepositToastErrorTitle.message),
    ).toBeInTheDocument();
    expect(screen.getByText('Bridge failed')).toBeInTheDocument();
  });

  it('hides completion toast after auto-hide', () => {
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
      jest.advanceTimersByTime(5_000);
    });

    expect(screen.queryByTestId('perps-deposit-toast')).not.toBeInTheDocument();
    expect(submitRequestToBackgroundMock).toHaveBeenCalledWith(
      'perpsClearDepositResult',
      [],
    );
  });

  it('shows a new completion toast after dismissing an older one', async () => {
    const user = userEvent.setup();
    const initialStore = configureStore({
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

    const { unmount } = renderWithProvider(<PerpsDepositToast />, initialStore);

    await user.click(
      screen.getByRole('button', { name: messages.close.message }),
    );

    expect(screen.queryByTestId('perps-deposit-toast')).not.toBeInTheDocument();

    unmount();

    const nextStore = configureStore({
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
          timestamp: 1_700_000_000_001,
        },
      },
    });

    renderWithProvider(<PerpsDepositToast />, nextStore);

    expect(screen.getByTestId('perps-deposit-toast')).toBeInTheDocument();
  });

  it('clears the deposit result when the completion toast is dismissed', async () => {
    const user = userEvent.setup();
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

    await user.click(
      screen.getByRole('button', { name: messages.close.message }),
    );

    expect(submitRequestToBackgroundMock).toHaveBeenCalledWith(
      'perpsClearDepositResult',
      [],
    );
  });

  it('dismisses a completion toast without a numeric timestamp', async () => {
    const user = userEvent.setup();
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
        },
      },
    });

    renderWithProvider(<PerpsDepositToast />, store);

    await user.click(
      screen.getByRole('button', { name: messages.close.message }),
    );

    expect(screen.queryByTestId('perps-deposit-toast')).not.toBeInTheDocument();
    expect(submitRequestToBackgroundMock).toHaveBeenCalledWith(
      'perpsClearDepositResult',
      [],
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

    expect(
      screen.getByText(messages.perpsDepositToastSuccessTitle.message),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(messages.perpsDepositToastPendingTitle.message),
    ).not.toBeInTheDocument();
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

    expect(screen.queryByTestId('perps-deposit-toast')).not.toBeInTheDocument();

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

    expect(screen.getByTestId('perps-deposit-toast')).toBeInTheDocument();
    expect(
      screen.getByText(messages.perpsDepositToastPendingTitle.message),
    ).toBeInTheDocument();
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

    expect(screen.queryByTestId('perps-deposit-toast')).not.toBeInTheDocument();

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

    expect(screen.getByTestId('perps-deposit-toast')).toBeInTheDocument();
    expect(
      screen.getByText(messages.perpsDepositToastPendingTitle.message),
    ).toBeInTheDocument();
  });

  it('shows completion toast when deposit result arrives', () => {
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
        transactions: [],
        lastDepositTransactionId: null,
        lastDepositResult: null,
      },
    });

    renderWithProvider(<PerpsDepositToast />, store);

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

    expect(screen.getByTestId('perps-deposit-toast')).toBeInTheDocument();

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

    expect(
      screen.getByText(messages.perpsDepositToastSuccessTitle.message),
    ).toBeInTheDocument();
  });

  it('does not show completion toast for token-funded deposits', () => {
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
        transactions: [
          buildPendingDepositTransaction({
            id: 'submitted-tx-1',
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

    expect(screen.queryByTestId('perps-deposit-toast')).not.toBeInTheDocument();
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

    expect(
      screen.getByText(messages.perpsDepositToastPendingTitle.message),
    ).toBeInTheDocument();
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

    expect(screen.queryByTestId('perps-deposit-toast')).not.toBeInTheDocument();
  });
});
