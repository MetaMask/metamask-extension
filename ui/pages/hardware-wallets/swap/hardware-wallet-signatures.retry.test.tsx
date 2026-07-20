import React from 'react';
import { act, fireEvent } from '@testing-library/react';
import { QrScanRequestType } from '@metamask/eth-qr-keyring';
import { ErrorCode } from '@metamask/hw-wallet-sdk';
import { TransactionType } from '@metamask/transaction-controller';
import configureStore from '../../../store/store';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
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
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
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

const mockUseSubmitBridgeTransaction =
  useSubmitBridgeTransaction as jest.MockedFunction<
    typeof useSubmitBridgeTransaction
  >;

const LEDGER_ACCOUNT_GROUP =
  'keyring:Ledger Hardware/0xb3864b298f4fddbbbd2fa5cf1a2a2748932b3b82';

type TestQuote =
  | (typeof DummyQuotesWithApproval.ETH_11_USDC_TO_ARB)[number]
  | (typeof DummyQuotesNoApproval.OP_0_005_ETH_TO_ARB)[number];

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
          address: quote.quote.src.asset.assetId,
          symbol: quote.quote.src.asset.symbol,
        },
        toToken: {
          address: quote.quote.dest.asset.assetId,
          symbol: quote.quote.dest.asset.symbol,
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
    // Retry/cancel paths call abortTransactionSigning via useHwSignTracker.
    submitRequestToBackground: jest.fn().mockResolvedValue(undefined),
    subscribeToMessengerEvent: jest
      .fn()
      .mockResolvedValue(createMockUnsubscribe()),
  };
});

describe('HardwareWalletSignatures', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockUseHardwareWalletState.mockReturnValue({
      connectionState: { status: ConnectionStatus.Ready },
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('hardware wallet error monitoring', () => {
    const renderWithLedgerAccount = () => {
      const quote = DummyQuotesWithApproval.ETH_11_USDC_TO_ARB[0];
      return renderWithQuote(quote);
    };

    it('shows "Reconnect your device and try again" when the device disconnects during signing', () => {
      mockUseSubmitBridgeTransaction.mockReturnValue(defaultMockSubmitReturn());
      mockUseHardwareWalletState.mockReturnValue({
        connectionState: {
          status: ConnectionStatus.ErrorState,
          error: createHardwareWalletError(
            ErrorCode.DeviceDisconnected,
            HardwareWalletType.Ledger,
            'Device disconnected',
          ),
        },
      });

      const { getByText, getByRole } = renderWithLedgerAccount();

      expect(
        getByText(messages.hardwareDeviceDisconnected.message),
      ).toBeDefined();
      expect(
        getByRole('button', {
          name: messages.hardwareWalletErrorReconnectButton.message,
        }),
      ).toBeDefined();
    });

    it('shows "Transaction rejected" when the device reports a user rejection', () => {
      mockUseSubmitBridgeTransaction.mockReturnValue(defaultMockSubmitReturn());
      mockUseHardwareWalletState.mockReturnValue({
        connectionState: {
          status: ConnectionStatus.ErrorState,
          error: createHardwareWalletError(
            ErrorCode.UserRejected,
            HardwareWalletType.Ledger,
            'User rejected',
          ),
        },
      });

      const { getByText, getByRole } = renderWithLedgerAccount();

      expect(
        getByText(messages.hardwareTransactionRejected.message),
      ).toBeDefined();
      expect(
        getByRole('button', { name: messages.errorPageTryAgain.message }),
      ).toBeDefined();
    });

    it('shows "Transaction failed" for other connection errors', () => {
      mockUseSubmitBridgeTransaction.mockReturnValue(defaultMockSubmitReturn());
      mockUseHardwareWalletState.mockReturnValue({
        connectionState: {
          status: ConnectionStatus.ErrorState,
          error: createHardwareWalletError(
            ErrorCode.ConnectionTimeout,
            HardwareWalletType.Ledger,
            'Connection timeout',
          ),
        },
      });

      const { getAllByText, getByRole } = renderWithLedgerAccount();

      expect(
        getAllByText(messages.transactionFailed.message).length,
      ).toBeGreaterThan(0);
      expect(
        getByRole('button', { name: messages.errorPageTryAgain.message }),
      ).toBeDefined();
    });

    it('shows "Reconnect your device and try again" when connection status is Disconnected', () => {
      mockUseSubmitBridgeTransaction.mockReturnValue(defaultMockSubmitReturn());
      mockUseHardwareWalletState.mockReturnValue({
        connectionState: {
          status: ConnectionStatus.Disconnected,
        },
      });

      const { getByText, getByRole } = renderWithLedgerAccount();

      expect(
        getByText(messages.hardwareDeviceDisconnected.message),
      ).toBeDefined();
      expect(
        getByRole('button', {
          name: messages.hardwareWalletErrorReconnectButton.message,
        }),
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
      const quote = DummyQuotesWithApproval.ETH_11_USDC_TO_ARB[0];
      const { getByText, getByRole } = renderWithQuote(quote);

      expect(getByText(messages.swapConfirmWithHwWallet.message)).toBeDefined();

      const statusUpdatedCallback = callbacks.get(
        'TransactionController:transactionStatusUpdated',
      );

      await act(async () => {
        statusUpdatedCallback?.([
          {
            transactionMeta: {
              status: 'signed',
              type: TransactionType.bridgeApproval,
              txParams: { from: '0xc5fe6ef47965741f6f7a4734bf784bf3ae3f2452' },
              batchId: 'batch-1',
            },
          },
        ]);
      });

      expect(
        getByText(messages.hardwareAlmostThereTitle.message),
      ).toBeDefined();

      const rejectedCallback = callbacks.get(
        'TransactionController:transactionRejected',
      );

      await act(async () => {
        rejectedCallback?.([
          {
            transactionMeta: {
              type: TransactionType.bridge,
              txParams: { from: '0xc5fe6ef47965741f6f7a4734bf784bf3ae3f2452' },
              batchId: 'batch-1',
            },
          },
        ]);
      });

      expect(
        getByText(messages.hardwareTransactionRejected.message),
      ).toBeDefined();

      await act(async () => {
        fireEvent.click(
          getByRole('button', { name: messages.errorPageTryAgain.message }),
        );
        await jest.advanceTimersByTimeAsync(6_000);
      });

      expect(
        getByText(messages.hardwareAlmostThereTitle.message),
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
      const quote = DummyQuotesWithApproval.ETH_11_USDC_TO_ARB[0];
      const { getByText, getByRole } = renderWithQuote(quote);

      const statusUpdatedCallback = callbacks.get(
        'TransactionController:transactionStatusUpdated',
      );

      await act(async () => {
        statusUpdatedCallback?.([
          {
            transactionMeta: {
              status: 'signed',
              type: TransactionType.bridgeApproval,
              txParams: { from: '0xc5fe6ef47965741f6f7a4734bf784bf3ae3f2452' },
              batchId: 'batch-1',
            },
          },
        ]);
      });

      await act(async () => {
        statusUpdatedCallback?.([
          {
            transactionMeta: {
              status: 'failed',
              type: TransactionType.bridgeApproval,
              txParams: { from: '0xc5fe6ef47965741f6f7a4734bf784bf3ae3f2452' },
              batchId: 'batch-1',
            },
          },
        ]);
      });

      expect(getByText(messages.transactionFailed.message)).toBeDefined();

      await act(async () => {
        fireEvent.click(
          getByRole('button', { name: messages.errorPageTryAgain.message }),
        );
        await jest.advanceTimersByTimeAsync(6_000);
      });

      expect(mockSubmit).toHaveBeenCalledTimes(2);
      expect(
        getByText(messages.hardwareAlmostThereTitle.message),
      ).toBeDefined();

      jest.restoreAllMocks();
    });

    it('calls submitBridgeTransaction on retry after disconnect with fresh adapter', async () => {
      const mockSubmit = jest.fn().mockResolvedValue(undefined);
      mockUseSubmitBridgeTransaction.mockReturnValue({
        submitBridgeTransaction: mockSubmit,
        isSubmitting: false,
      });
      mockUseHardwareWalletState.mockReturnValue({
        connectionState: {
          status: ConnectionStatus.ErrorState,
          error: createHardwareWalletError(
            ErrorCode.DeviceDisconnected,
            HardwareWalletType.Ledger,
            'Device disconnected',
          ),
        },
      });

      const quote = DummyQuotesWithApproval.ETH_11_USDC_TO_ARB[0];
      const { getByRole, getByText, rerender } = renderWithQuote(quote);

      expect(
        getByText(messages.hardwareDeviceDisconnected.message),
      ).toBeDefined();

      mockUseHardwareWalletState.mockReturnValue({
        connectionState: { status: ConnectionStatus.Ready },
      });
      rerender(<HardwareWalletSignatures />);

      await act(async () => {
        fireEvent.click(
          getByRole('button', {
            name: messages.hardwareWalletErrorReconnectButton.message,
          }),
        );
        await jest.advanceTimersByTimeAsync(1_000);
      });

      // Bridge submit API is quote-only after the signing-page options revert.
      expect(mockSubmit).toHaveBeenCalledWith(expect.anything());
    });

    it('resets and resubmits on retry after disconnect', async () => {
      const mockSubmit = jest.fn().mockResolvedValue(undefined);
      mockUseSubmitBridgeTransaction.mockReturnValue({
        submitBridgeTransaction: mockSubmit,
        isSubmitting: false,
      });
      mockUseHardwareWalletState.mockReturnValue({
        connectionState: {
          status: ConnectionStatus.ErrorState,
          error: createHardwareWalletError(
            ErrorCode.DeviceDisconnected,
            HardwareWalletType.Ledger,
            'Device disconnected',
          ),
        },
      });

      const quote = DummyQuotesWithApproval.ETH_11_USDC_TO_ARB[0];
      const { getByRole, getByText, queryByText, rerender } =
        renderWithQuote(quote);

      expect(
        getByText(messages.hardwareDeviceDisconnected.message),
      ).toBeDefined();

      const submitCountBeforeRetry = mockSubmit.mock.calls.length;

      // Simulate device reconnecting before user clicks Reconnect
      mockUseHardwareWalletState.mockReturnValue({
        connectionState: { status: ConnectionStatus.Ready },
      });
      rerender(<HardwareWalletSignatures />);

      await act(async () => {
        fireEvent.click(
          getByRole('button', {
            name: messages.hardwareWalletErrorReconnectButton.message,
          }),
        );
        await jest.advanceTimersByTimeAsync(1_000);
      });

      expect(mockSubmit).toHaveBeenCalledTimes(submitCountBeforeRetry + 1);
      expect(getByText(messages.swapConfirmWithHwWallet.message)).toBeDefined();
      expect(
        queryByText(messages.hardwareDeviceDisconnected.message),
      ).toBeNull();
    });

    it('does not resubmit on retry after disconnect when device is still Connecting', async () => {
      const mockSubmit = jest.fn().mockResolvedValue(undefined);
      mockUseSubmitBridgeTransaction.mockReturnValue({
        submitBridgeTransaction: mockSubmit,
        isSubmitting: false,
      });
      mockUseHardwareWalletState.mockReturnValue({
        connectionState: {
          status: ConnectionStatus.ErrorState,
          error: createHardwareWalletError(
            ErrorCode.DeviceDisconnected,
            HardwareWalletType.Ledger,
            'Device disconnected',
          ),
        },
      });

      const quote = DummyQuotesWithApproval.ETH_11_USDC_TO_ARB[0];
      const { getByRole, getByText, rerender } = renderWithQuote(quote);

      expect(
        getByText(messages.hardwareDeviceDisconnected.message),
      ).toBeDefined();

      const submitCountBeforeRetry = mockSubmit.mock.calls.length;

      mockUseHardwareWalletState.mockReturnValue({
        connectionState: {
          status: ConnectionStatus.Connecting,
        },
      });
      rerender(<HardwareWalletSignatures />);

      await act(async () => {
        fireEvent.click(
          getByRole('button', {
            name: messages.hardwareWalletErrorReconnectButton.message,
          }),
        );
      });

      expect(mockSubmit).toHaveBeenCalledTimes(submitCountBeforeRetry);
    });

    it('does resubmit on retry after disconnect when device is Connected', async () => {
      const mockSubmit = jest.fn().mockResolvedValue(undefined);
      mockUseSubmitBridgeTransaction.mockReturnValue({
        submitBridgeTransaction: mockSubmit,
        isSubmitting: false,
      });
      mockUseHardwareWalletState.mockReturnValue({
        connectionState: {
          status: ConnectionStatus.ErrorState,
          error: createHardwareWalletError(
            ErrorCode.DeviceDisconnected,
            HardwareWalletType.Ledger,
            'Device disconnected',
          ),
        },
      });

      const quote = DummyQuotesWithApproval.ETH_11_USDC_TO_ARB[0];
      const { getByRole, getByText, rerender } = renderWithQuote(quote);

      expect(
        getByText(messages.hardwareDeviceDisconnected.message),
      ).toBeDefined();

      const submitCountBeforeRetry = mockSubmit.mock.calls.length;

      mockUseHardwareWalletState.mockReturnValue({
        connectionState: {
          status: ConnectionStatus.Connected,
        },
      });
      rerender(<HardwareWalletSignatures />);

      await act(async () => {
        fireEvent.click(
          getByRole('button', {
            name: messages.hardwareWalletErrorReconnectButton.message,
          }),
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
      mockUseHardwareWalletState.mockReturnValue({
        connectionState: {
          status: ConnectionStatus.Disconnected,
        },
      });
      const quote = DummyQuotesWithApproval.ETH_11_USDC_TO_ARB[0];
      const { getByText, getByRole, rerender } = renderWithQuote(quote);

      const statusUpdatedCallback = callbacks.get(
        'TransactionController:transactionStatusUpdated',
      );

      await act(async () => {
        statusUpdatedCallback?.([
          {
            transactionMeta: {
              status: 'signed',
              type: TransactionType.bridgeApproval,
              txParams: { from: '0xc5fe6ef47965741f6f7a4734bf784bf3ae3f2452' },
              batchId: 'batch-1',
            },
          },
        ]);
      });

      const rejectedCallback = callbacks.get(
        'TransactionController:transactionRejected',
      );

      await act(async () => {
        rejectedCallback?.([
          {
            transactionMeta: {
              type: TransactionType.bridge,
              txParams: { from: '0xc5fe6ef47965741f6f7a4734bf784bf3ae3f2452' },
              batchId: 'batch-1',
            },
          },
        ]);
      });

      expect(
        getByText(messages.hardwareTransactionRejected.message),
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
      const mockSubmit = jest.fn().mockResolvedValue(undefined);
      mockUseSubmitBridgeTransaction.mockReturnValue({
        submitBridgeTransaction: mockSubmit,
        isSubmitting: false,
      });
      mockUseHardwareWalletState.mockReturnValue({
        connectionState: {
          status: ConnectionStatus.ErrorState,
          error: createHardwareWalletError(
            ErrorCode.DeviceDisconnected,
            HardwareWalletType.Ledger,
            'Device disconnected',
          ),
        },
      });

      const quote = DummyQuotesWithApproval.ETH_11_USDC_TO_ARB[0];
      const { getByRole, getByText, rerender } = renderWithQuote(quote);

      expect(
        getByText(messages.hardwareDeviceDisconnected.message),
      ).toBeDefined();

      const submitCountBeforeRetry = mockSubmit.mock.calls.length;

      mockUseHardwareWalletState.mockReturnValue({
        connectionState: {
          status: ConnectionStatus.ErrorState,
          error: createHardwareWalletError(
            ErrorCode.UserRejected,
            HardwareWalletType.Ledger,
            'User rejected stale request',
          ),
        },
      });
      rerender(<HardwareWalletSignatures />);

      await act(async () => {
        fireEvent.click(
          getByRole('button', {
            name: messages.hardwareWalletErrorReconnectButton.message,
          }),
        );
        await jest.advanceTimersByTimeAsync(1_000);
      });

      expect(mockSubmit).toHaveBeenCalledTimes(submitCountBeforeRetry + 1);
      // Bridge submit API is quote-only after the signing-page options revert.
      expect(mockSubmit).toHaveBeenCalledWith(expect.anything());
    });

    it('does resubmit on retry after rejection when device is reconnected', async () => {
      const { callbacks } = mockSubscriptions();
      const mockSubmit = jest.fn().mockResolvedValue(undefined);
      mockUseSubmitBridgeTransaction.mockReturnValue({
        submitBridgeTransaction: mockSubmit,
        isSubmitting: false,
      });
      const quote = DummyQuotesWithApproval.ETH_11_USDC_TO_ARB[0];
      const { getByText, getByRole, rerender } = renderWithQuote(quote);

      const statusUpdatedCallback = callbacks.get(
        'TransactionController:transactionStatusUpdated',
      );

      await act(async () => {
        statusUpdatedCallback?.([
          {
            transactionMeta: {
              status: 'signed',
              type: TransactionType.bridgeApproval,
              txParams: { from: '0xc5fe6ef47965741f6f7a4734bf784bf3ae3f2452' },
              batchId: 'batch-1',
            },
          },
        ]);
      });

      const rejectedCallback = callbacks.get(
        'TransactionController:transactionRejected',
      );

      await act(async () => {
        rejectedCallback?.([
          {
            transactionMeta: {
              type: TransactionType.bridge,
              txParams: { from: '0xc5fe6ef47965741f6f7a4734bf784bf3ae3f2452' },
              batchId: 'batch-1',
            },
          },
        ]);
      });

      expect(
        getByText(messages.hardwareTransactionRejected.message),
      ).toBeDefined();

      const submitCountBeforeRetry = mockSubmit.mock.calls.length;

      mockUseHardwareWalletState.mockReturnValue({
        connectionState: { status: ConnectionStatus.Ready },
      });
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
