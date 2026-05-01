import React from 'react';
import { act } from '@testing-library/react';
import { QrScanRequestType } from '@metamask/eth-qr-keyring';
import { ErrorCode } from '@metamask/hw-wallet-sdk';
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
import HardwareWalletSignatures from '.';

jest.mock('../hooks/useSubmitBridgeTransaction');
jest.mock('./generic-hardware-wallet-animation', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: () => <div data-testid="generic-hardware-wallet-animation" />,
}));

const mockUseHardwareWalletState = jest.fn();

jest.mock('../../../contexts/hardware-wallets', () => ({
  ...jest.requireActual('../../../contexts/hardware-wallets'),
  useHardwareWalletState: () => mockUseHardwareWalletState(),
}));

const mockUseSubmitBridgeTransaction =
  useSubmitBridgeTransaction as jest.MockedFunction<
    typeof useSubmitBridgeTransaction
  >;

const LEDGER_ACCOUNT_GROUP =
  'keyring:Ledger Hardware/0xb3864b298f4fddbbbd2fa5cf1a2a2748932b3b82';

function renderWithQuote(
  quote: (typeof DummyQuotesWithApproval.ETH_11_USDC_TO_ARB)[0],
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
        quotes: [quote],
        quotesLastFetched: 100,
      },
      metamaskStateOverrides: {
        internalAccounts: {
          selectedAccount: MOCK_LEDGER_ACCOUNT.id,
        },
        accountTree: {
          selectedAccountGroup: LEDGER_ACCOUNT_GROUP,
        },
      },
    }),
  );
  return renderWithProvider(<HardwareWalletSignatures />, store);
}

const defaultMockSubmitReturn = () => ({
  submitBridgeTransaction: jest.fn().mockResolvedValue(undefined),
  isSubmitting: false,
});

describe('HardwareWalletSignatures', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseHardwareWalletState.mockReturnValue({
      connectionState: { status: ConnectionStatus.Ready },
    });
  });

  it('renders the generic hardware wallet animation', () => {
    mockUseSubmitBridgeTransaction.mockReturnValue(defaultMockSubmitReturn());
    const quote = DummyQuotesWithApproval.ETH_11_USDC_TO_ARB[0];
    const { getByTestId } = renderWithQuote(quote);

    expect(getByTestId('generic-hardware-wallet-animation')).toBeDefined();
  });

  it('subscribes to BridgeStatusController:stateChange and transitions to step 2 when approvalTxId appears in txHistory', async () => {
    let capturedCallback:
      | ((
          data: [
            {
              txHistory: Record<
                string,
                {
                  approvalTxId?: string;
                  quote?: { requestId?: string };
                }
              >;
            },
          ],
        ) => void)
      | undefined;
    const mockUnsubscribe = jest.fn().mockResolvedValue(undefined);
    jest
      .spyOn(backgroundConnection, 'subscribeToMessengerEvent')
      .mockImplementation(async (_event, callback) => {
        if (_event === 'BridgeStatusController:stateChange') {
          capturedCallback = callback;
        }
        return mockUnsubscribe;
      });
    mockUseSubmitBridgeTransaction.mockReturnValue(defaultMockSubmitReturn());
    const quote = DummyQuotesWithApproval.ETH_11_USDC_TO_ARB[0];
    const { getByText } = renderWithQuote(quote);

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    expect(backgroundConnection.subscribeToMessengerEvent).toHaveBeenCalledWith(
      'BridgeStatusController:stateChange',
      expect.any(Function),
    );

    expect(getByText('Confirm with your hardware wallet (1/2)')).toBeDefined();

    await act(async () => {
      capturedCallback?.([
        {
          txHistory: {
            'some-tx-id': {
              approvalTxId: 'approval-tx-123',
              quote: { requestId: '0cd5caf6-9844-465b-89ad-9c89b639f432' },
            },
          },
        },
      ]);
    });

    expect(getByText('Confirm with your hardware wallet (2/2)')).toBeDefined();

    jest.restoreAllMocks();
  });

  it('does not subscribe to BridgeStatusController:stateChange for single-confirmation flows (no approval needed)', async () => {
    const subscribeSpy = jest
      .spyOn(backgroundConnection, 'subscribeToMessengerEvent')
      .mockResolvedValue(jest.fn().mockResolvedValue(undefined));
    mockUseSubmitBridgeTransaction.mockReturnValue(defaultMockSubmitReturn());
    const quote = DummyQuotesNoApproval.OP_0_005_ETH_TO_ARB[0];
    renderWithQuote(quote);

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    expect(subscribeSpy).not.toHaveBeenCalled();

    subscribeSpy.mockRestore();
  });

  it('does not subscribe to BridgeStatusController:stateChange for gasless flows (gasIncluded7702) even with approval', async () => {
    const subscribeSpy = jest
      .spyOn(backgroundConnection, 'subscribeToMessengerEvent')
      .mockResolvedValue(jest.fn().mockResolvedValue(undefined));
    mockUseSubmitBridgeTransaction.mockReturnValue(defaultMockSubmitReturn());
    const quote = {
      ...DummyQuotesWithApproval.ETH_11_USDC_TO_ARB[0],
      quote: {
        ...DummyQuotesWithApproval.ETH_11_USDC_TO_ARB[0].quote,
        gasIncluded7702: true,
      },
    };
    renderWithQuote(quote);

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    // Should NOT subscribe to BridgeStatusController:stateChange for gasless
    expect(subscribeSpy).not.toHaveBeenCalledWith(
      'BridgeStatusController:stateChange',
      expect.any(Function),
    );

    // But SHOULD subscribe to TransactionController:transactionApproved
    expect(subscribeSpy).toHaveBeenCalledWith(
      'TransactionController:transactionApproved',
      expect.any(Function),
    );

    subscribeSpy.mockRestore();
  });

  it('transitions to step 2 when gasless batch tx is approved via TransactionController event', async () => {
    let capturedCallback:
      | ((
          data: [
            {
              transactionMeta: {
                batchId?: string;
                txParams: { from?: string };
              };
            },
          ],
        ) => void)
      | undefined;
    const mockUnsubscribe = jest.fn().mockResolvedValue(undefined);
    jest
      .spyOn(backgroundConnection, 'subscribeToMessengerEvent')
      .mockImplementation(async (_event, callback) => {
        if (_event === 'TransactionController:transactionApproved') {
          capturedCallback = callback;
        }
        return mockUnsubscribe;
      });
    mockUseSubmitBridgeTransaction.mockReturnValue(defaultMockSubmitReturn());
    const quote = {
      ...DummyQuotesWithApproval.ETH_11_USDC_TO_ARB[0],
      quote: {
        ...DummyQuotesWithApproval.ETH_11_USDC_TO_ARB[0].quote,
        gasIncluded7702: true,
      },
    };
    const { getByText } = renderWithQuote(quote);

    expect(getByText('Confirm with your hardware wallet (1/2)')).toBeDefined();

    await act(async () => {
      capturedCallback?.([
        {
          transactionMeta: {
            batchId: '0x1',
            txParams: { from: '0xc5fe6ef47965741f6f7a4734bf784bf3ae3f2452' },
          },
        },
      ]);
    });

    expect(getByText('Confirm with your hardware wallet (2/2)')).toBeDefined();

    jest.restoreAllMocks();
  });

  it('shows "Transaction submitted" once the bridge submission callback fires', async () => {
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

    expect(getByText('Confirm with your hardware wallet (1/2)')).toBeDefined();

    await act(async () => {
      onHardwareWalletSubmittedCallbacks[0]?.();
    });

    expect(getByText('Transaction submitted')).toBeDefined();
  });

  it('stays at "Transaction submitted" when a late BridgeStatusController:stateChange event arrives after onHardwareWalletSubmitted', async () => {
    let capturedCallback:
      | ((
          data: [
            {
              txHistory: Record<
                string,
                {
                  approvalTxId?: string;
                  quote?: { requestId?: string };
                }
              >;
            },
          ],
        ) => void)
      | undefined;
    const mockUnsubscribe = jest.fn().mockResolvedValue(undefined);
    jest
      .spyOn(backgroundConnection, 'subscribeToMessengerEvent')
      .mockImplementation(async (_event, callback) => {
        if (_event === 'BridgeStatusController:stateChange') {
          capturedCallback = callback;
        }
        return mockUnsubscribe;
      });
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

    expect(getByText('Transaction submitted')).toBeDefined();

    // Late BSC stateChange event arrives after submission — should NOT revert state
    await act(async () => {
      capturedCallback?.([
        {
          txHistory: {
            'some-tx-id': {
              approvalTxId: 'approval-tx-123',
              quote: { requestId: '0cd5caf6-9844-465b-89ad-9c89b639f432' },
            },
          },
        },
      ]);
    });

    expect(getByText('Transaction submitted')).toBeDefined();

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
          quotes: [quote],
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
        },
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

    expect(
      getByText('Scan QR code below and sign on your device (1/2)'),
    ).toBeDefined();
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

    it('shows "Transaction failed" when the device disconnects during signing', () => {
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

      const { getAllByText, getByRole } = renderWithLedgerAccount();

      expect(getAllByText('Transaction failed').length).toBeGreaterThan(0);
      expect(getByRole('button', { name: 'Try again' })).toBeDefined();
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

    it('does not transition out of "Transaction submitted" when an error appears afterwards', async () => {
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
        onHardwareWalletSubmittedCallbacks[0]?.();
      });

      expect(getByText('Transaction submitted')).toBeDefined();

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

      expect(getByText('Transaction submitted')).toBeDefined();
    });
  });
});
