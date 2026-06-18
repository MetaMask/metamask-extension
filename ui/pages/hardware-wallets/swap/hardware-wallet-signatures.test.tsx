import React from 'react';
import { act, fireEvent } from '@testing-library/react';
import { QrScanRequestType } from '@metamask/eth-qr-keyring';
import { ErrorCode } from '@metamask/hw-wallet-sdk';
import { TransactionType } from '@metamask/transaction-controller';
import configureStore from '../../../store/store';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import {
  createBridgeMockStore,
  MOCK_LEDGER_ACCOUNT,
} from '../../../../test/data/bridge/mock-bridge-store';
import {
  DummyQuotesNoApproval,
  DummyQuotesWithApproval,
} from '../../../../test/data/bridge/dummy-quotes';
import { HardwareKeyringType } from '../../../../shared/constants/hardware-wallets';
import {
  ConnectionStatus,
  HardwareWalletType,
} from '../../../contexts/hardware-wallets';
import { createHardwareWalletError } from '../../../contexts/hardware-wallets/errors';
import * as backgroundConnection from '../../../store/background-connection';
import useSubmitBridgeTransaction from '../../../hooks/bridge/useSubmitBridgeTransaction';
import HardwareWalletSignatures from '.';

jest.mock('../../../hooks/bridge/useSubmitBridgeTransaction');
jest.mock('../../../components/app/toast-listener/shared', () => ({
  showSuccessToast: jest.fn(),
}));
jest.mock('./generic-hardware-wallet-animation', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: () => <div data-testid="generic-hardware-wallet-animation" />,
}));

const mockUseHardwareWalletState = jest.fn();
const mockEnsureDeviceReady = jest.fn().mockResolvedValue(true);

jest.mock('../../../contexts/hardware-wallets', () => ({
  ...jest.requireActual('../../../contexts/hardware-wallets'),
  useHardwareWalletState: () => mockUseHardwareWalletState(),
  useHardwareWalletActions: () => ({
    ensureDeviceReady: mockEnsureDeviceReady,
    setSigningInProgress: jest.fn(),
  }),
}));

jest.mock('../../../store/background-connection', () => {
  const actual = jest.requireActual('../../../store/background-connection');
  const createMockUnsubscribe = () => {
    const fn = jest.fn().mockResolvedValue(undefined) as jest.Mock & {
      catch: jest.Mock;
    };
    fn.catch = jest.fn();
    return fn;
  };
  return {
    ...actual,
    subscribeToMessengerEvent: jest
      .fn()
      .mockResolvedValue(createMockUnsubscribe()),
  };
});

const mockUseSubmitBridgeTransaction =
  useSubmitBridgeTransaction as jest.MockedFunction<
    typeof useSubmitBridgeTransaction
  >;

const LEDGER_ACCOUNT_GROUP =
  'keyring:Ledger Hardware/0xb3864b298f4fddbbbd2fa5cf1a2a2748932b3b82';

const TX_FROM = '0xc5fe6ef47965741f6f7a4734bf784bf3ae3f2452';

const TX_EVENTS = {
  statusUpdated: 'TransactionController:transactionStatusUpdated',
  rejected: 'TransactionController:transactionRejected',
  finished: 'TransactionController:transactionFinished',
} as const;

type TestQuote =
  | (typeof DummyQuotesWithApproval.ETH_11_USDC_TO_ARB)[number]
  | (typeof DummyQuotesNoApproval.OP_0_005_ETH_TO_ARB)[number];

const APPROVAL_QUOTE = () => DummyQuotesWithApproval.ETH_11_USDC_TO_ARB[0];

function renderWithQuote(
  quote: TestQuote,
  overrides?: {
    bridgeStateOverrides?: Record<string, unknown>;
    metamaskStateOverrides?: Record<string, unknown>;
  },
) {
  const store = configureStore(
    createBridgeMockStore({
      bridgeSliceOverrides: {
        fromToken: {
          address: quote.quote.srcAsset.address,
          symbol: quote.quote.srcAsset.symbol,
        },
        toToken: {
          address: quote.quote.destAsset.address,
          symbol: quote.quote.destAsset.symbol,
        },
      },
      bridgeStateOverrides: {
        quotes: [quote as never],
        quotesLastFetched: 100,
        ...overrides?.bridgeStateOverrides,
      },
      metamaskStateOverrides: {
        internalAccounts: {
          selectedAccount: MOCK_LEDGER_ACCOUNT.id,
        },
        accountTree: {
          selectedAccountGroup: LEDGER_ACCOUNT_GROUP,
        },
        ...overrides?.metamaskStateOverrides,
      },
    }),
  );
  return renderWithProvider(<HardwareWalletSignatures />, store);
}

const defaultMockSubmitReturn = () => ({
  submitBridgeTransaction: jest.fn().mockResolvedValue(undefined),
  isSubmitting: false,
});

// Builds a transaction meta payload with the standard test `from` address.
const buildTxMeta = (
  type: TransactionType,
  opts: { status?: string; batchId?: string } = {},
) => ({ type, txParams: { from: TX_FROM }, ...opts });

// Invokes a TransactionController subscription callback with a single
// transaction meta payload, wrapped in act() for React state updates.
const fireTxEvent = (
  cb: ((...args: unknown[]) => void) | undefined,
  meta: ReturnType<typeof buildTxMeta>,
) => act(async () => cb?.([{ transactionMeta: meta as never }]));

// Mocks useHardwareWalletState with either a plain status or an error state.
const mockConnectionState = (
  status: ConnectionStatus,
  errorCode?: ErrorCode,
  message = '',
) =>
  mockUseHardwareWalletState.mockReturnValue({
    connectionState: errorCode
      ? {
          status,
          error: createHardwareWalletError(
            errorCode,
            HardwareWalletType.Ledger,
            message,
          ),
        }
      : { status },
  });

// Captures onHardwareWalletSubmitted callbacks so tests can trigger them.
function mockSubmittedCallback() {
  const callbacks: (() => void)[] = [];
  mockUseSubmitBridgeTransaction.mockImplementation((options) => {
    if (options?.onHardwareWalletSubmitted) {
      callbacks.push(options.onHardwareWalletSubmitted);
    }
    return defaultMockSubmitReturn();
  });
  return callbacks;
}

function mockSubscriptions() {
  const callbacks = new Map<string, (...args: unknown[]) => void>();
  const createMockUnsubscribe = () => {
    const fn = jest.fn().mockResolvedValue(undefined) as jest.Mock & {
      catch: jest.Mock;
    };
    fn.catch = jest.fn();
    return fn;
  };
  jest
    .spyOn(backgroundConnection, 'subscribeToMessengerEvent')
    .mockImplementation((async (
      event: string,
      callback: (...args: unknown[]) => void,
    ) => {
      callbacks.set(event, callback);
      return createMockUnsubscribe();
    }) as never);
  return { callbacks };
}

// Renders a wallet that starts in ErrorState (device disconnected) and returns
// the submit mock and render result for retry assertions.
function setupDisconnectedWallet() {
  const mockSubmit = jest.fn().mockResolvedValue(undefined);
  mockUseSubmitBridgeTransaction.mockReturnValue({
    submitBridgeTransaction: mockSubmit,
    isSubmitting: false,
  });
  mockConnectionState(
    ConnectionStatus.ErrorState,
    ErrorCode.DeviceDisconnected,
    'Device disconnected',
  );
  const result = renderWithQuote(APPROVAL_QUOTE());
  return {
    mockSubmit,
    submitCountBeforeRetry: mockSubmit.mock.calls.length,
    result,
  };
}

// Renders a QR hardware wallet with an active sign request.
function renderQrWallet(bridgeStateOverrides?: Record<string, unknown>) {
  const quote = APPROVAL_QUOTE();
  const qrAccount = {
    ...MOCK_LEDGER_ACCOUNT,
    metadata: {
      ...MOCK_LEDGER_ACCOUNT.metadata,
      keyring: { type: HardwareKeyringType.qr },
    },
  };
  const store = configureStore(
    createBridgeMockStore({
      bridgeSliceOverrides: {
        fromToken: {
          address: quote.quote.srcAsset.address,
          symbol: quote.quote.srcAsset.symbol,
        },
        toToken: {
          address: quote.quote.destAsset.address,
          symbol: quote.quote.destAsset.symbol,
        },
      },
      bridgeStateOverrides: {
        quotes: [quote as never],
        quotesLastFetched: 100,
        activeQrCodeScanRequest: {
          type: QrScanRequestType.SIGN,
          request: {
            requestId: 'sign-request-id',
            payload: { type: 'eth-sign-request', cbor: 'a201010203' },
          },
        },
        ...bridgeStateOverrides,
      } as never,
      metamaskStateOverrides: {
        internalAccounts: {
          selectedAccount: qrAccount.id,
          accounts: { [qrAccount.id]: qrAccount },
        },
      },
    }),
  );
  return renderWithProvider(<HardwareWalletSignatures />, store);
}

describe('HardwareWalletSignatures', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockUseSubmitBridgeTransaction.mockReturnValue(defaultMockSubmitReturn());
    mockUseHardwareWalletState.mockReturnValue({
      connectionState: { status: ConnectionStatus.Ready },
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the generic hardware wallet animation', () => {
    const { getByTestId } = renderWithQuote(APPROVAL_QUOTE());
    expect(getByTestId('generic-hardware-wallet-animation')).toBeDefined();
  });

  it('renders the title and steps for a two-confirmation flow', () => {
    const { getByText } = renderWithQuote(APPROVAL_QUOTE());
    expect(getByText(messages.swapConfirmWithHwWallet.message)).toBeDefined();
    expect(getByText('Approve 11 USDC')).toBeDefined();
    expect(getByText('Send 11 USDC')).toBeDefined();
  });

  it('renders the title and single step for a one-confirmation flow', () => {
    const { getByText, queryByText } = renderWithQuote(
      DummyQuotesNoApproval.OP_0_005_ETH_TO_ARB[0],
    );
    expect(getByText(messages.swapConfirmWithHwWallet.message)).toBeDefined();
    expect(queryByText(messages.approveButtonText.message)).toBeNull();
    expect(getByText('Sending 0.005 ETH')).toBeDefined();
  });

  it('renders cancel button', () => {
    const { getByRole } = renderWithQuote(APPROVAL_QUOTE());
    expect(
      getByRole('button', { name: messages.cancel.message }),
    ).toBeDefined();
  });

  it('subscribes to TransactionController events via useHwSignTracker', async () => {
    const { callbacks } = mockSubscriptions();
    renderWithQuote(APPROVAL_QUOTE());

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    expect(callbacks.has(TX_EVENTS.statusUpdated)).toBe(true);
    expect(callbacks.has(TX_EVENTS.rejected)).toBe(true);
    expect(callbacks.has(TX_EVENTS.finished)).toBe(true);

    jest.restoreAllMocks();
  });

  it('transitions to step 2 when approval tx is signed via TransactionController event', async () => {
    const { callbacks } = mockSubscriptions();
    const { getByText } = renderWithQuote(APPROVAL_QUOTE());

    expect(getByText(messages.swapConfirmWithHwWallet.message)).toBeDefined();

    await fireTxEvent(
      callbacks.get(TX_EVENTS.statusUpdated),
      buildTxMeta(TransactionType.bridgeApproval, { status: 'signed' }),
    );

    expect(getByText(messages.bridgeHwAlmostThereTitle.message)).toBeDefined();

    jest.restoreAllMocks();
  });

  it('transitions to Submitted when trade tx is signed via TransactionController event', async () => {
    const { callbacks } = mockSubscriptions();
    const { getByText } = renderWithQuote(
      DummyQuotesNoApproval.OP_0_005_ETH_TO_ARB[0],
    );

    expect(getByText(messages.swapConfirmWithHwWallet.message)).toBeDefined();

    await fireTxEvent(
      callbacks.get(TX_EVENTS.statusUpdated),
      buildTxMeta(TransactionType.bridge, { status: 'signed' }),
    );

    expect(getByText("You're all set")).toBeDefined();

    jest.restoreAllMocks();
  });

  it('transitions to Failed when transaction fails via TransactionController event', async () => {
    const { callbacks } = mockSubscriptions();
    const { getByText } = renderWithQuote(APPROVAL_QUOTE());

    const cb = callbacks.get(TX_EVENTS.statusUpdated);

    await fireTxEvent(
      cb,
      buildTxMeta(TransactionType.bridgeApproval, {
        status: 'signed',
        batchId: 'batch-1',
      }),
    );
    await fireTxEvent(
      cb,
      buildTxMeta(TransactionType.bridgeApproval, {
        status: 'failed',
        batchId: 'batch-1',
      }),
    );

    expect(getByText(messages.transactionFailed.message)).toBeDefined();

    jest.restoreAllMocks();
  });

  it('transitions to Rejected when transaction is rejected via TransactionController event', async () => {
    const { callbacks } = mockSubscriptions();
    const { getByText } = renderWithQuote(APPROVAL_QUOTE());

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    await fireTxEvent(
      callbacks.get(TX_EVENTS.statusUpdated),
      buildTxMeta(TransactionType.bridgeApproval, {
        status: 'signed',
        batchId: 'batch-1',
      }),
    );

    await fireTxEvent(
      callbacks.get(TX_EVENTS.rejected),
      buildTxMeta(TransactionType.bridgeApproval, { batchId: 'batch-1' }),
    );

    expect(
      getByText(messages.bridgeHwTransactionRejected.message),
    ).toBeDefined();

    jest.restoreAllMocks();
  });

  it('transitions to Failed when transaction finished with failed status', async () => {
    const { callbacks } = mockSubscriptions();
    const { getAllByText } = renderWithQuote(APPROVAL_QUOTE());

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    await fireTxEvent(
      callbacks.get(TX_EVENTS.statusUpdated),
      buildTxMeta(TransactionType.bridgeApproval, {
        status: 'signed',
        batchId: 'batch-1',
      }),
    );

    await fireTxEvent(
      callbacks.get(TX_EVENTS.finished),
      buildTxMeta(TransactionType.bridgeApproval, {
        status: 'failed',
        batchId: 'batch-1',
      }),
    );

    expect(
      getAllByText(messages.transactionFailed.message).length,
    ).toBeGreaterThan(0);

    jest.restoreAllMocks();
  });

  it('transitions to Rejected when transaction finished with rejected status', async () => {
    const { callbacks } = mockSubscriptions();
    const { getByText } = renderWithQuote(APPROVAL_QUOTE());

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    await fireTxEvent(
      callbacks.get(TX_EVENTS.statusUpdated),
      buildTxMeta(TransactionType.bridgeApproval, {
        status: 'signed',
        batchId: 'batch-1',
      }),
    );

    await fireTxEvent(
      callbacks.get(TX_EVENTS.finished),
      buildTxMeta(TransactionType.bridgeApproval, {
        status: 'rejected',
        batchId: 'batch-1',
      }),
    );

    expect(
      getByText(messages.bridgeHwTransactionRejected.message),
    ).toBeDefined();

    jest.restoreAllMocks();
  });

  it('shows "You\'re all set" once the bridge submission callback fires', async () => {
    const cbs = mockSubmittedCallback();
    const { getByText } = renderWithQuote(APPROVAL_QUOTE());

    expect(getByText(messages.swapConfirmWithHwWallet.message)).toBeDefined();

    await act(async () => {
      cbs[0]?.();
    });

    expect(getByText("You're all set")).toBeDefined();
  });

  it('hides footer when submitted', async () => {
    const cbs = mockSubmittedCallback();
    const { getByText, queryByRole } = renderWithQuote(APPROVAL_QUOTE());

    await act(async () => {
      cbs[0]?.();
    });

    expect(getByText("You're all set")).toBeDefined();
    expect(queryByRole('button', { name: messages.cancel.message })).toBeNull();
  });

  it('stays at "You\'re all set" when a late TransactionController event arrives after submission', async () => {
    const { callbacks } = mockSubscriptions();
    const cbs = mockSubmittedCallback();
    const { getByText } = renderWithQuote(APPROVAL_QUOTE());

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    await act(async () => {
      cbs[0]?.();
    });

    expect(getByText("You're all set")).toBeDefined();

    await fireTxEvent(
      callbacks.get(TX_EVENTS.statusUpdated),
      buildTxMeta(TransactionType.bridgeApproval, { status: 'signed' }),
    );

    expect(getByText("You're all set")).toBeDefined();

    jest.restoreAllMocks();
  });

  it('shows the inline QR code for QR hardware wallets that need two signatures', () => {
    const { getByRole, getByTestId, queryByTestId } = renderQrWallet();

    expect(queryByTestId('qr-hardware-signing-page')).toBeNull();
    expect(getByTestId('hardware-wallet-signatures__steps')).toBeDefined();
    expect(
      getByRole('button', { name: "I've signed, scan signature" }),
    ).toBeDefined();
  });

  describe('QR toggle button', () => {
    it('shows scan signature button initially on the QR signing page', () => {
      const { getByRole } = renderQrWallet();

      expect(
        getByRole('button', { name: "I've signed, scan signature" }),
      ).toBeDefined();
    });

    it('opens the scanner when continue is pressed on the QR signing page', () => {
      const { getByRole, queryByRole } = renderQrWallet();

      fireEvent.click(
        getByRole('button', { name: "I've signed, scan signature" }),
      );

      expect(
        queryByRole('button', { name: "I've signed, scan signature" }),
      ).toBeNull();
    });

    it('returns to the progress view when back is pressed from the scanner', () => {
      const { getByRole } = renderQrWallet();

      fireEvent.click(
        getByRole('button', { name: "I've signed, scan signature" }),
      );
      fireEvent.click(getByRole('button', { name: messages.back.message }));

      expect(
        getByRole('button', { name: "I've signed, scan signature" }),
      ).toBeDefined();
    });
  });

  describe('hardware wallet error monitoring', () => {
    it('shows "Reconnect your device and try again" when the device disconnects during signing', () => {
      mockConnectionState(
        ConnectionStatus.ErrorState,
        ErrorCode.DeviceDisconnected,
        'Device disconnected',
      );

      const { getByText, getByRole } = renderWithQuote(APPROVAL_QUOTE());

      expect(getByText(messages.bridgeHwDeviceDisconnected.message)).toBeDefined();
      expect(
        getByRole('button', { name: messages.hardwareWalletErrorReconnectButton.message }),
      ).toBeDefined();
    });

    it('shows "Transaction rejected" when the device reports a user rejection', () => {
      mockConnectionState(
        ConnectionStatus.ErrorState,
        ErrorCode.UserRejected,
        'User rejected',
      );

      const { getByText, getByRole } = renderWithQuote(APPROVAL_QUOTE());

      expect(
        getByText(messages.bridgeHwTransactionRejected.message),
      ).toBeDefined();
      expect(
        getByRole('button', { name: messages.errorPageTryAgain.message }),
      ).toBeDefined();
    });

    it('shows "Transaction failed" for other connection errors', () => {
      mockConnectionState(
        ConnectionStatus.ErrorState,
        ErrorCode.ConnectionTimeout,
        'Connection timeout',
      );

      const { getAllByText, getByRole } = renderWithQuote(APPROVAL_QUOTE());

      expect(
        getAllByText(messages.transactionFailed.message).length,
      ).toBeGreaterThan(0);
      expect(
        getByRole('button', { name: messages.errorPageTryAgain.message }),
      ).toBeDefined();
    });

    it('does not transition out of "You\'re all set" when an error appears afterwards', async () => {
      const cbs = mockSubmittedCallback();
      const { getByText, rerender } = renderWithQuote(APPROVAL_QUOTE());

      await act(async () => {
        cbs[0]?.();
      });

      expect(getByText("You're all set")).toBeDefined();

      mockConnectionState(
        ConnectionStatus.ErrorState,
        ErrorCode.DeviceDisconnected,
        'Device disconnected',
      );

      rerender(<HardwareWalletSignatures />);

      expect(getByText("You're all set")).toBeDefined();
    });

    it('shows "Reconnect your device and try again" when connection status is Disconnected', () => {
      mockConnectionState(ConnectionStatus.Disconnected);

      const { getByText, getByRole } = renderWithQuote(APPROVAL_QUOTE());

      expect(getByText(messages.bridgeHwDeviceDisconnected.message)).toBeDefined();
      expect(
        getByRole('button', { name: messages.hardwareWalletErrorReconnectButton.message }),
      ).toBeDefined();
    });
  });

  describe('retry behavior', () => {
    it('resets to initial step on retry after rejection', async () => {
      const { callbacks } = mockSubscriptions();
      const mockSubmit = jest.fn().mockResolvedValue(undefined);
      mockUseSubmitBridgeTransaction.mockReturnValue({
        submitBridgeTransaction: mockSubmit,
        isSubmitting: false,
      });
      const { getByText, getByRole } = renderWithQuote(APPROVAL_QUOTE());

      expect(getByText(messages.swapConfirmWithHwWallet.message)).toBeDefined();

      await fireTxEvent(
        callbacks.get(TX_EVENTS.statusUpdated),
        buildTxMeta(TransactionType.bridgeApproval, {
          status: 'signed',
          batchId: 'batch-1',
        }),
      );

      expect(
        getByText(messages.bridgeHwAlmostThereTitle.message),
      ).toBeDefined();

      await fireTxEvent(
        callbacks.get(TX_EVENTS.rejected),
        buildTxMeta(TransactionType.bridge, { batchId: 'batch-1' }),
      );

      expect(
        getByText(messages.bridgeHwTransactionRejected.message),
      ).toBeDefined();

      await act(async () => {
        fireEvent.click(
          getByRole('button', { name: messages.errorPageTryAgain.message }),
        );
        await jest.advanceTimersByTimeAsync(6_000);
      });

      expect(
        getByText(messages.bridgeHwAlmostThereTitle.message),
      ).toBeDefined();

      jest.restoreAllMocks();
    });

    it('resets to initial step and resubmits on retry after failure', async () => {
      const { callbacks } = mockSubscriptions();
      const mockSubmit = jest.fn().mockResolvedValue(undefined);
      mockUseSubmitBridgeTransaction.mockReturnValue({
        submitBridgeTransaction: mockSubmit,
        isSubmitting: false,
      });
      const { getByText, getByRole } = renderWithQuote(APPROVAL_QUOTE());

      const cb = callbacks.get(TX_EVENTS.statusUpdated);

      await fireTxEvent(
        cb,
        buildTxMeta(TransactionType.bridgeApproval, {
          status: 'signed',
          batchId: 'batch-1',
        }),
      );

      await fireTxEvent(
        cb,
        buildTxMeta(TransactionType.bridgeApproval, {
          status: 'failed',
          batchId: 'batch-1',
        }),
      );

      expect(getByText(messages.transactionFailed.message)).toBeDefined();

      await act(async () => {
        fireEvent.click(
          getByRole('button', { name: messages.errorPageTryAgain.message }),
        );
        await jest.advanceTimersByTimeAsync(6_000);
      });

      expect(mockSubmit).toHaveBeenCalledTimes(2);
      expect(
        getByText(messages.bridgeHwAlmostThereTitle.message),
      ).toBeDefined();

      jest.restoreAllMocks();
    });

    it('calls submitBridgeTransaction on retry after disconnect with fresh adapter', async () => {
      const { mockSubmit, result } = setupDisconnectedWallet();

      expect(
        result.getByText(messages.bridgeHwDeviceDisconnected.message),
      ).toBeDefined();

      mockConnectionState(ConnectionStatus.Ready);
      result.rerender(<HardwareWalletSignatures />);

      await act(async () => {
        fireEvent.click(
          result.getByRole('button', { name: messages.hardwareWalletErrorReconnectButton.message }),
        );
        await jest.advanceTimersByTimeAsync(1_000);
      });

      expect(mockSubmit).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ rpcTimeoutMs: 120_000 }),
      );
    });

    it('resets and resubmits on retry after disconnect', async () => {
      const { mockSubmit, submitCountBeforeRetry, result } =
        setupDisconnectedWallet();

      expect(
        result.getByText(messages.bridgeHwDeviceDisconnected.message),
      ).toBeDefined();

      mockConnectionState(ConnectionStatus.Ready);
      result.rerender(<HardwareWalletSignatures />);

      await act(async () => {
        fireEvent.click(
          result.getByRole('button', { name: messages.hardwareWalletErrorReconnectButton.message }),
        );
        await jest.advanceTimersByTimeAsync(1_000);
      });

      expect(mockSubmit).toHaveBeenCalledTimes(submitCountBeforeRetry + 1);
      expect(
        result.getByText(messages.swapConfirmWithHwWallet.message),
      ).toBeDefined();
      expect(
        result.queryByText(messages.bridgeHwDeviceDisconnected.message),
      ).toBeNull();
    });

    it('does not resubmit on retry after disconnect when device is still Connecting', async () => {
      const { mockSubmit, submitCountBeforeRetry, result } =
        setupDisconnectedWallet();

      mockConnectionState(ConnectionStatus.Connecting);
      result.rerender(<HardwareWalletSignatures />);

      await act(async () => {
        fireEvent.click(
          result.getByRole('button', { name: messages.hardwareWalletErrorReconnectButton.message }),
        );
      });

      expect(mockSubmit).toHaveBeenCalledTimes(submitCountBeforeRetry);
    });

    it('does resubmit on retry after disconnect when device is Connected', async () => {
      const { mockSubmit, submitCountBeforeRetry, result } =
        setupDisconnectedWallet();

      mockConnectionState(ConnectionStatus.Connected);
      result.rerender(<HardwareWalletSignatures />);

      await act(async () => {
        fireEvent.click(
          result.getByRole('button', { name: messages.hardwareWalletErrorReconnectButton.message }),
        );
        await jest.advanceTimersByTimeAsync(1_000);
      });

      expect(mockSubmit).toHaveBeenCalledTimes(submitCountBeforeRetry + 1);
    });

    it('does not resubmit on retry after rejection when device is disconnected', async () => {
      const { callbacks } = mockSubscriptions();
      const mockSubmit = jest.fn().mockResolvedValue(undefined);
      mockUseSubmitBridgeTransaction.mockReturnValue({
        submitBridgeTransaction: mockSubmit,
        isSubmitting: false,
      });
      mockConnectionState(ConnectionStatus.Disconnected);

      const { getByText, getByRole, rerender } =
        renderWithQuote(APPROVAL_QUOTE());

      await fireTxEvent(
        callbacks.get(TX_EVENTS.statusUpdated),
        buildTxMeta(TransactionType.bridgeApproval, {
          status: 'signed',
          batchId: 'batch-1',
        }),
      );

      await fireTxEvent(
        callbacks.get(TX_EVENTS.rejected),
        buildTxMeta(TransactionType.bridge, { batchId: 'batch-1' }),
      );

      expect(
        getByText(messages.bridgeHwTransactionRejected.message),
      ).toBeDefined();

      const submitCountBeforeRetry = mockSubmit.mock.calls.length;

      rerender(<HardwareWalletSignatures />);

      await act(async () => {
        fireEvent.click(
          getByRole('button', { name: messages.errorPageTryAgain.message }),
        );
      });

      expect(mockSubmit).toHaveBeenCalledTimes(submitCountBeforeRetry);

      jest.restoreAllMocks();
    });

    it('resubmits on retry after disconnect when device reconnected with stale user rejection ErrorState', async () => {
      const { mockSubmit, submitCountBeforeRetry, result } =
        setupDisconnectedWallet();

      mockConnectionState(
        ConnectionStatus.ErrorState,
        ErrorCode.UserRejected,
        'User rejected stale request',
      );
      result.rerender(<HardwareWalletSignatures />);

      await act(async () => {
        fireEvent.click(
          result.getByRole('button', { name: messages.hardwareWalletErrorReconnectButton.message }),
        );
        await jest.advanceTimersByTimeAsync(1_000);
      });

      expect(mockSubmit).toHaveBeenCalledTimes(submitCountBeforeRetry + 1);
      expect(mockSubmit).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ rpcTimeoutMs: 120_000 }),
      );
    });

    it('does resubmit on retry after rejection when device is reconnected', async () => {
      const { callbacks } = mockSubscriptions();
      const mockSubmit = jest.fn().mockResolvedValue(undefined);
      mockUseSubmitBridgeTransaction.mockReturnValue({
        submitBridgeTransaction: mockSubmit,
        isSubmitting: false,
      });
      const { getByText, getByRole, rerender } =
        renderWithQuote(APPROVAL_QUOTE());

      await fireTxEvent(
        callbacks.get(TX_EVENTS.statusUpdated),
        buildTxMeta(TransactionType.bridgeApproval, {
          status: 'signed',
          batchId: 'batch-1',
        }),
      );

      await fireTxEvent(
        callbacks.get(TX_EVENTS.rejected),
        buildTxMeta(TransactionType.bridge, { batchId: 'batch-1' }),
      );

      expect(
        getByText(messages.bridgeHwTransactionRejected.message),
      ).toBeDefined();

      const submitCountBeforeRetry = mockSubmit.mock.calls.length;

      rerender(<HardwareWalletSignatures />);

      await act(async () => {
        fireEvent.click(
          getByRole('button', { name: messages.errorPageTryAgain.message }),
        );
        await jest.advanceTimersByTimeAsync(6_000);
      });

      expect(mockSubmit).toHaveBeenCalledTimes(submitCountBeforeRetry + 1);

      jest.restoreAllMocks();
    });
  });
});
