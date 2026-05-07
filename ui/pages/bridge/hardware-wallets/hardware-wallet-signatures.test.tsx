import React from 'react';
import { act, fireEvent } from '@testing-library/react';
import { QrScanRequestType } from '@metamask/eth-qr-keyring';
import { ErrorCode } from '@metamask/hw-wallet-sdk';
import { TransactionType } from '@metamask/transaction-controller';
import { Box } from '@metamask/design-system-react';
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
import useSubmitBridgeTransaction from '../hooks/useSubmitBridgeTransaction';
import { HardwareWalletSignatureEvent } from './hardware-wallet-signatures-state-machine';
import HardwareWalletSignatures from '.';

jest.mock('../hooks/useSubmitBridgeTransaction');
jest.mock('../../../app/toast-listener/shared', () => ({
  showSuccessToast: jest.fn(),
}));
jest.mock('./generic-hardware-wallet-animation', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: () => <Box data-testid="generic-hardware-wallet-animation" />,
}));

const mockUseHardwareWalletState = jest.fn();
const mockEnsureDeviceReady = jest.fn().mockResolvedValue(true);

jest.mock('../../../contexts/hardware-wallets', () => ({
  ...jest.requireActual('../../../contexts/hardware-wallets'),
  useHardwareWalletState: () => mockUseHardwareWalletState(),
  useHardwareWalletActions: () => ({
    ensureDeviceReady: mockEnsureDeviceReady,
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

  it('renders the generic hardware wallet animation', () => {
    mockUseSubmitBridgeTransaction.mockReturnValue(defaultMockSubmitReturn());
    const quote = DummyQuotesWithApproval.ETH_11_USDC_TO_ARB[0];
    const { getByTestId } = renderWithQuote(quote);

    expect(getByTestId('generic-hardware-wallet-animation')).toBeDefined();
  });

  it('renders the title and steps for a two-confirmation flow', () => {
    mockUseSubmitBridgeTransaction.mockReturnValue(defaultMockSubmitReturn());
    const quote = DummyQuotesWithApproval.ETH_11_USDC_TO_ARB[0];
    const { getByText } = renderWithQuote(quote);

    expect(getByText('Confirm with your hardware wallet')).toBeDefined();
    expect(getByText('Approve 11 USDC')).toBeDefined();
    expect(getByText('Send 11 USDC')).toBeDefined();
  });

  it('renders the title and single step for a one-confirmation flow', () => {
    mockUseSubmitBridgeTransaction.mockReturnValue(defaultMockSubmitReturn());
    const quote = DummyQuotesNoApproval.OP_0_005_ETH_TO_ARB[0];
    const { getByText, queryByText } = renderWithQuote(quote);

    expect(getByText('Confirm with your hardware wallet')).toBeDefined();
    expect(queryByText('Approve')).toBeNull();
    expect(getByText('Sending 0.005 ETH')).toBeDefined();
  });

  it('renders cancel button', () => {
    mockUseSubmitBridgeTransaction.mockReturnValue(defaultMockSubmitReturn());
    const quote = DummyQuotesWithApproval.ETH_11_USDC_TO_ARB[0];
    const { getByRole } = renderWithQuote(quote);

    expect(getByRole('button', { name: 'Cancel' })).toBeDefined();
  });

  it('subscribes to TransactionController events via useHwBatchSignTracker', async () => {
    const { callbacks } = mockSubscriptions();
    mockUseSubmitBridgeTransaction.mockReturnValue(defaultMockSubmitReturn());
    const quote = DummyQuotesWithApproval.ETH_11_USDC_TO_ARB[0];
    renderWithQuote(quote);

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    expect(
      callbacks.has('TransactionController:transactionStatusUpdated'),
    ).toBe(true);
    expect(callbacks.has('TransactionController:transactionRejected')).toBe(
      true,
    );
    expect(callbacks.has('TransactionController:transactionFinished')).toBe(
      true,
    );

    jest.restoreAllMocks();
  });

  it('transitions to step 2 when approval tx is signed via TransactionController event', async () => {
    const { callbacks } = mockSubscriptions();
    mockUseSubmitBridgeTransaction.mockReturnValue(defaultMockSubmitReturn());
    const quote = DummyQuotesWithApproval.ETH_11_USDC_TO_ARB[0];
    const { getByText } = renderWithQuote(quote);

    expect(getByText('Confirm with your hardware wallet')).toBeDefined();

    const statusUpdatedCallback = callbacks.get(
      'TransactionController:transactionStatusUpdated',
    );
    expect(statusUpdatedCallback).toBeDefined();

    await act(async () => {
      statusUpdatedCallback?.([
        {
          transactionMeta: {
            status: 'signed',
            type: TransactionType.bridgeApproval,
            txParams: { from: '0xc5fe6ef47965741f6f7a4734bf784bf3ae3f2452' },
          },
        },
      ]);
    });

    expect(
      getByText('Almost there! Confirm on your device again'),
    ).toBeDefined();

    jest.restoreAllMocks();
  });

  it('transitions to Submitted when trade tx is signed via TransactionController event', async () => {
    const { callbacks } = mockSubscriptions();
    mockUseSubmitBridgeTransaction.mockReturnValue(defaultMockSubmitReturn());
    const quote = DummyQuotesNoApproval.OP_0_005_ETH_TO_ARB[0];
    const { getByText } = renderWithQuote(quote);

    expect(getByText('Confirm with your hardware wallet')).toBeDefined();

    const statusUpdatedCallback = callbacks.get(
      'TransactionController:transactionStatusUpdated',
    );

    await act(async () => {
      statusUpdatedCallback?.([
        {
          transactionMeta: {
            status: 'signed',
            type: TransactionType.bridge,
            txParams: { from: '0xc5fe6ef47965741f6f7a4734bf784bf3ae3f2452' },
          },
        },
      ]);
    });

    expect(getByText("You're all set")).toBeDefined();

    jest.restoreAllMocks();
  });

  it('transitions to Failed when transaction fails via TransactionController event', async () => {
    const { callbacks } = mockSubscriptions();
    mockUseSubmitBridgeTransaction.mockReturnValue(defaultMockSubmitReturn());
    const quote = DummyQuotesWithApproval.ETH_11_USDC_TO_ARB[0];
    const { getByText } = renderWithQuote(quote);

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

    expect(getByText('Transaction failed')).toBeDefined();

    jest.restoreAllMocks();
  });

  it('transitions to Rejected when transaction is rejected via TransactionController event', async () => {
    const { callbacks } = mockSubscriptions();
    mockUseSubmitBridgeTransaction.mockReturnValue(defaultMockSubmitReturn());
    const quote = DummyQuotesWithApproval.ETH_11_USDC_TO_ARB[0];
    const { getByText } = renderWithQuote(quote);

    await act(async () => {
      await jest.runAllTimersAsync();
    });

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
            type: TransactionType.bridgeApproval,
            txParams: { from: '0xc5fe6ef47965741f6f7a4734bf784bf3ae3f2452' },
            batchId: 'batch-1',
          },
        },
      ]);
    });

    expect(
      getByText('You rejected this transaction on your device'),
    ).toBeDefined();

    jest.restoreAllMocks();
  });

  it('transitions to Failed when transaction finished with failed status', async () => {
    const { callbacks } = mockSubscriptions();
    mockUseSubmitBridgeTransaction.mockReturnValue(defaultMockSubmitReturn());
    const quote = DummyQuotesWithApproval.ETH_11_USDC_TO_ARB[0];
    const { getAllByText } = renderWithQuote(quote);

    await act(async () => {
      await jest.runAllTimersAsync();
    });

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

    const finishedCallback = callbacks.get(
      'TransactionController:transactionFinished',
    );

    await act(async () => {
      finishedCallback?.([
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

    expect(getAllByText('Transaction failed').length).toBeGreaterThan(0);

    jest.restoreAllMocks();
  });

  it('transitions to Rejected when transaction finished with rejected status', async () => {
    const { callbacks } = mockSubscriptions();
    mockUseSubmitBridgeTransaction.mockReturnValue(defaultMockSubmitReturn());
    const quote = DummyQuotesWithApproval.ETH_11_USDC_TO_ARB[0];
    const { getByText } = renderWithQuote(quote);

    await act(async () => {
      await jest.runAllTimersAsync();
    });

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

    const finishedCallback = callbacks.get(
      'TransactionController:transactionFinished',
    );

    await act(async () => {
      finishedCallback?.([
        {
          transactionMeta: {
            status: 'rejected',
            type: TransactionType.bridgeApproval,
            txParams: { from: '0xc5fe6ef47965741f6f7a4734bf784bf3ae3f2452' },
            batchId: 'batch-1',
          },
        },
      ]);
    });

    expect(
      getByText('You rejected this transaction on your device'),
    ).toBeDefined();

    jest.restoreAllMocks();
  });

  it('shows "You\'re all set" once the bridge submission callback fires', async () => {
    const onHardwareWalletSubmittedCallbacks: (() => void)[] = [];
    mockUseSubmitBridgeTransaction.mockImplementation((options) => {
      if (options?.onHardwareWalletSubmitted) {
        onHardwareWalletSubmittedCallbacks.push(
          options.onHardwareWalletSubmitted,
        );
      }

      return {
        submitBridgeTransaction: jest.fn().mockResolvedValue(undefined),
        isSubmitting: false,
      };
    });
    const quote = DummyQuotesWithApproval.ETH_11_USDC_TO_ARB[0];
    const { getByText } = renderWithQuote(quote);

    expect(getByText('Confirm with your hardware wallet')).toBeDefined();

    await act(async () => {
      onHardwareWalletSubmittedCallbacks[0]?.();
    });

    expect(getByText("You're all set")).toBeDefined();
  });

  it('hides footer when submitted', async () => {
    const onHardwareWalletSubmittedCallbacks: (() => void)[] = [];
    mockUseSubmitBridgeTransaction.mockImplementation((options) => {
      if (options?.onHardwareWalletSubmitted) {
        onHardwareWalletSubmittedCallbacks.push(
          options.onHardwareWalletSubmitted,
        );
      }

      return {
        submitBridgeTransaction: jest.fn().mockResolvedValue(undefined),
        isSubmitting: false,
      };
    });
    const quote = DummyQuotesWithApproval.ETH_11_USDC_TO_ARB[0];
    const { getByText, queryByRole } = renderWithQuote(quote);

    await act(async () => {
      onHardwareWalletSubmittedCallbacks[0]?.();
    });

    expect(getByText("You're all set")).toBeDefined();
    expect(queryByRole('button', { name: 'Cancel' })).toBeNull();
  });

  it('stays at "You\'re all set" when a late TransactionController event arrives after submission', async () => {
    const { callbacks } = mockSubscriptions();
    const onHardwareWalletSubmittedCallbacks: (() => void)[] = [];
    mockUseSubmitBridgeTransaction.mockImplementation((options) => {
      if (options?.onHardwareWalletSubmitted) {
        onHardwareWalletSubmittedCallbacks.push(
          options.onHardwareWalletSubmitted,
        );
      }

      return {
        submitBridgeTransaction: jest.fn().mockResolvedValue(undefined),
        isSubmitting: false,
      };
    });
    const quote = DummyQuotesWithApproval.ETH_11_USDC_TO_ARB[0];
    const { getByText } = renderWithQuote(quote);

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    await act(async () => {
      onHardwareWalletSubmittedCallbacks[0]?.();
    });

    expect(getByText("You're all set")).toBeDefined();

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
          },
        },
      ]);
    });

    expect(getByText("You're all set")).toBeDefined();

    jest.restoreAllMocks();
  });

  it('shows the active QR code inline for QR hardware wallets that need two signatures', () => {
    mockUseSubmitBridgeTransaction.mockReturnValue(defaultMockSubmitReturn());
    const quote = DummyQuotesWithApproval.ETH_11_USDC_TO_ARB[0];
    const qrAccount = {
      ...MOCK_LEDGER_ACCOUNT,
      metadata: {
        ...MOCK_LEDGER_ACCOUNT.metadata,
        keyring: {
          type: HardwareKeyringType.qr,
        },
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
              payload: {
                type: 'eth-sign-request',
                cbor: 'a201010203',
              },
            },
          },
        } as never,
        metamaskStateOverrides: {
          internalAccounts: {
            selectedAccount: qrAccount.id,
            accounts: {
              [qrAccount.id]: qrAccount,
            },
          },
        },
      }),
    );
    const { getByRole, getByText, container } = renderWithProvider(
      <HardwareWalletSignatures />,
      store,
    );

    expect(getByText('Confirm with your hardware wallet')).toBeDefined();
    expect(getByText('Approve 11 USDC')).toBeDefined();
    expect(getByText('Send 11 USDC')).toBeDefined();
    expect(
      getByRole('button', { name: "I've signed, scan signature" }),
    ).toBeDefined();
    expect(
      container.querySelector('.hardware-wallet-signatures__qr-code svg'),
    ).not.toBeNull();
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

      expect(getByText('Reconnect your device and try again')).toBeDefined();
      expect(
        getByRole('button', { name: 'Reconnect and try again' }),
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
        getByText('You rejected this transaction on your device'),
      ).toBeDefined();
      expect(getByRole('button', { name: 'Try again' })).toBeDefined();
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

      expect(getAllByText('Transaction failed').length).toBeGreaterThan(0);
      expect(getByRole('button', { name: 'Try again' })).toBeDefined();
    });

    it('does not transition out of "You\'re all set" when an error appears afterwards', async () => {
      const onHardwareWalletSubmittedCallbacks: (() => void)[] = [];
      mockUseSubmitBridgeTransaction.mockImplementation((options) => {
        if (options?.onHardwareWalletSubmitted) {
          onHardwareWalletSubmittedCallbacks.push(
            options.onHardwareWalletSubmitted,
          );
        }
        return {
          submitBridgeTransaction: jest.fn().mockResolvedValue(undefined),
          isSubmitting: false,
        };
      });

      const { getByText, rerender } = renderWithLedgerAccount();

      await act(async () => {
        onHardwareWalletSubmittedCallbacks[0]?.();
      });

      expect(getByText("You're all set")).toBeDefined();

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

      rerender(<HardwareWalletSignatures />);

      expect(getByText("You're all set")).toBeDefined();
    });

    it('shows "Reconnect your device and try again" when connection status is Disconnected', () => {
      mockUseSubmitBridgeTransaction.mockReturnValue(defaultMockSubmitReturn());
      mockUseHardwareWalletState.mockReturnValue({
        connectionState: {
          status: ConnectionStatus.Disconnected,
        },
      });

      const { getByText, getByRole } = renderWithLedgerAccount();

      expect(getByText('Reconnect your device and try again')).toBeDefined();
      expect(
        getByRole('button', { name: 'Reconnect and try again' }),
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

      expect(getByText('Confirm with your hardware wallet')).toBeDefined();

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
        getByText('Almost there! Confirm on your device again'),
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
        getByText('You rejected this transaction on your device'),
      ).toBeDefined();

      await act(async () => {
        fireEvent.click(getByRole('button', { name: 'Try again' }));
        await jest.advanceTimersByTimeAsync(1_000);
      });

      expect(getByText('Confirm with your hardware wallet')).toBeDefined();

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

      expect(getByText('Transaction failed')).toBeDefined();

      await act(async () => {
        fireEvent.click(getByRole('button', { name: 'Try again' }));
        await jest.advanceTimersByTimeAsync(1_000);
      });

      expect(mockSubmit).toHaveBeenCalledTimes(2);
      expect(getByText('Confirm with your hardware wallet')).toBeDefined();

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

      expect(getByText('Reconnect your device and try again')).toBeDefined();

      mockUseHardwareWalletState.mockReturnValue({
        connectionState: { status: ConnectionStatus.Ready },
      });
      rerender(<HardwareWalletSignatures />);

      await act(async () => {
        fireEvent.click(
          getByRole('button', { name: 'Reconnect and try again' }),
        );
        await jest.advanceTimersByTimeAsync(1_000);
      });

      expect(mockSubmit).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ rpcTimeoutMs: 120_000 }),
      );
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

      expect(getByText('Reconnect your device and try again')).toBeDefined();

      const submitCountBeforeRetry = mockSubmit.mock.calls.length;

      // Simulate device reconnecting before user clicks Reconnect
      mockUseHardwareWalletState.mockReturnValue({
        connectionState: { status: ConnectionStatus.Ready },
      });
      rerender(<HardwareWalletSignatures />);

      await act(async () => {
        fireEvent.click(
          getByRole('button', { name: 'Reconnect and try again' }),
        );
        await jest.advanceTimersByTimeAsync(1_000);
      });

      expect(mockSubmit).toHaveBeenCalledTimes(submitCountBeforeRetry + 1);
      expect(getByText('Confirm with your hardware wallet')).toBeDefined();
      expect(queryByText('Reconnect your device and try again')).toBeNull();
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

      expect(getByText('Reconnect your device and try again')).toBeDefined();

      const submitCountBeforeRetry = mockSubmit.mock.calls.length;

      mockUseHardwareWalletState.mockReturnValue({
        connectionState: {
          status: ConnectionStatus.Connecting,
        },
      });
      rerender(<HardwareWalletSignatures />);

      await act(async () => {
        fireEvent.click(
          getByRole('button', { name: 'Reconnect and try again' }),
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

      expect(getByText('Reconnect your device and try again')).toBeDefined();

      const submitCountBeforeRetry = mockSubmit.mock.calls.length;

      mockUseHardwareWalletState.mockReturnValue({
        connectionState: {
          status: ConnectionStatus.Connected,
        },
      });
      rerender(<HardwareWalletSignatures />);

      await act(async () => {
        fireEvent.click(
          getByRole('button', { name: 'Reconnect and try again' }),
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
        getByText('You rejected this transaction on your device'),
      ).toBeDefined();

      const submitCountBeforeRetry = mockSubmit.mock.calls.length;

      rerender(<HardwareWalletSignatures />);

      await act(async () => {
        fireEvent.click(getByRole('button', { name: 'Try again' }));
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

      expect(getByText('Reconnect your device and try again')).toBeDefined();

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
          getByRole('button', { name: 'Reconnect and try again' }),
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
        getByText('You rejected this transaction on your device'),
      ).toBeDefined();

      const submitCountBeforeRetry = mockSubmit.mock.calls.length;

      mockUseHardwareWalletState.mockReturnValue({
        connectionState: { status: ConnectionStatus.Ready },
      });
      rerender(<HardwareWalletSignatures />);

      await act(async () => {
        fireEvent.click(getByRole('button', { name: 'Try again' }));
        await jest.advanceTimersByTimeAsync(1_000);
      });

      expect(mockSubmit).toHaveBeenCalledTimes(submitCountBeforeRetry + 1);

      jest.restoreAllMocks();
    });
  });
});
