import React from 'react';
import { act, fireEvent } from '@testing-library/react';
import { QrScanRequestType } from '@metamask/eth-qr-keyring';
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
import { ConnectionStatus } from '../../../contexts/hardware-wallets';
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

jest.mock('../../../components/app/qr-hardware-popover/base-qr-reader', () => {
  const MockBaseQrReader = () => <div data-testid="mock-base-qr-reader" />;
  MockBaseQrReader.displayName = 'MockBaseQrReader';
  return {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __esModule: true,
    default: MockBaseQrReader,
    UrType: {
      CryptoHdkey: 'crypto-hdkey',
      CryptoAccount: 'crypto-account',
      EthSignature: 'eth-signature',
    },
    PAIRING_EXPECTED_UR_TYPES: ['crypto-hdkey', 'crypto-account'],
    SIGNING_EXPECTED_UR_TYPES: ['eth-signature'],
    CBOR_ENCODING: 'hex',
  };
});

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
    // Cancel/abort paths call abortTransactionSigning via useHwSignTracker.
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

    expect(getByText(messages.swapConfirmWithHwWallet.message)).toBeDefined();
    expect(getByText('Approve 11 USDC')).toBeDefined();
    expect(getByText('Send 11 USDC')).toBeDefined();
  });

  it('renders the title and single step for a one-confirmation flow', () => {
    mockUseSubmitBridgeTransaction.mockReturnValue(defaultMockSubmitReturn());
    const quote = DummyQuotesNoApproval.OP_0_005_ETH_TO_ARB[0];
    const { getByText, queryByText } = renderWithQuote(quote);

    expect(getByText(messages.swapConfirmWithHwWallet.message)).toBeDefined();
    expect(queryByText(messages.approveButtonText.message)).toBeNull();
    expect(getByText('Sending 0.005 ETH')).toBeDefined();
  });

  it('renders cancel button', () => {
    mockUseSubmitBridgeTransaction.mockReturnValue(defaultMockSubmitReturn());
    const quote = DummyQuotesWithApproval.ETH_11_USDC_TO_ARB[0];
    const { getByRole } = renderWithQuote(quote);

    expect(
      getByRole('button', { name: messages.cancel.message }),
    ).toBeDefined();
  });

  it('subscribes to TransactionController events via useHwSignTracker', async () => {
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

    expect(getByText(messages.swapConfirmWithHwWallet.message)).toBeDefined();

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

    expect(getByText(messages.hardwareAlmostThereTitle.message)).toBeDefined();

    jest.restoreAllMocks();
  });

  it('transitions to Submitted when trade tx is signed via TransactionController event', async () => {
    const { callbacks } = mockSubscriptions();
    mockUseSubmitBridgeTransaction.mockReturnValue(defaultMockSubmitReturn());
    const quote = DummyQuotesNoApproval.OP_0_005_ETH_TO_ARB[0];
    const { getByText } = renderWithQuote(quote);

    expect(getByText(messages.swapConfirmWithHwWallet.message)).toBeDefined();

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

    expect(getByText(messages.transactionFailed.message)).toBeDefined();

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
      getByText(messages.hardwareTransactionRejected.message),
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

    expect(
      getAllByText(messages.transactionFailed.message).length,
    ).toBeGreaterThan(0);

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
      getByText(messages.hardwareTransactionRejected.message),
    ).toBeDefined();

    jest.restoreAllMocks();
  });

  it('shows the inline QR code for QR hardware wallets that need two signatures', () => {
    mockUseSubmitBridgeTransaction.mockReturnValue(defaultMockSubmitReturn());
    const quote = DummyQuotesWithApproval.ETH_11_USDC_TO_ARB[0];
    const qrAccount = {
      ...MOCK_LEDGER_ACCOUNT,
      id: 'qr-account-id',
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
    const { getByRole, getByTestId, queryByTestId } = renderWithProvider(
      <HardwareWalletSignatures />,
      store,
    );

    expect(queryByTestId('qr-hardware-signing-page')).toBeNull();
    expect(getByTestId('hardware-wallet-signatures__steps')).toBeDefined();
    expect(
      getByRole('button', {
        name: messages.qrHardwareScanSignatureNext.message,
      }),
    ).toBeDefined();
  });

  describe('QR toggle button', () => {
    const qrAccount = {
      ...MOCK_LEDGER_ACCOUNT,
      id: 'qr-account-id',
      metadata: {
        ...MOCK_LEDGER_ACCOUNT.metadata,
        keyring: {
          type: HardwareKeyringType.qr,
        },
      },
    };

    function renderQrWallet() {
      mockUseSubmitBridgeTransaction.mockReturnValue(defaultMockSubmitReturn());
      const quote = DummyQuotesWithApproval.ETH_11_USDC_TO_ARB[0];
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
      return renderWithProvider(<HardwareWalletSignatures />, store);
    }

    it('shows scan signature button initially on the QR signing page', () => {
      const { getByRole } = renderQrWallet();

      expect(
        getByRole('button', {
          name: messages.qrHardwareScanSignatureNext.message,
        }),
      ).toBeDefined();
    });

    it('opens the scanner when continue is pressed on the QR signing page', () => {
      const { getByRole, queryByRole } = renderQrWallet();

      fireEvent.click(
        getByRole('button', {
          name: messages.qrHardwareScanSignatureNext.message,
        }),
      );

      expect(
        queryByRole('button', {
          name: messages.qrHardwareScanSignatureNext.message,
        }),
      ).toBeNull();
    });

    it('returns to the progress view when back is pressed from the scanner', () => {
      const { getByRole } = renderQrWallet();

      fireEvent.click(
        getByRole('button', {
          name: messages.qrHardwareScanSignatureNext.message,
        }),
      );
      fireEvent.click(getByRole('button', { name: messages.back.message }));

      expect(
        getByRole('button', {
          name: messages.qrHardwareScanSignatureNext.message,
        }),
      ).toBeDefined();
    });
  });
});
