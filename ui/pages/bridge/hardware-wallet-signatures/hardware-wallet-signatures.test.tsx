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
import { DummyQuotesWithApproval } from '../../../../test/data/bridge/dummy-quotes';
import { HardwareKeyringType } from '../../../../shared/constants/hardware-wallets';
import {
  ConnectionStatus,
  HardwareWalletType,
} from '../../../contexts/hardware-wallets';
import { createHardwareWalletError } from '../../../contexts/hardware-wallets/errors';
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

describe('HardwareWalletSignatures', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseHardwareWalletState.mockReturnValue({
      connectionState: { status: ConnectionStatus.Ready },
    });
  });

  it('renders the generic hardware wallet animation', () => {
    mockUseSubmitBridgeTransaction.mockReturnValue({
      submitBridgeTransaction: jest.fn().mockResolvedValue(undefined),
      isSubmitting: false,
    });
    const quote = DummyQuotesWithApproval.ETH_11_USDC_TO_ARB[0];
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
            selectedAccountGroup:
              'keyring:Ledger Hardware/0xb3864b298f4fddbbbd2fa5cf1a2a2748932b3b82',
          },
        },
      }),
    );
    const { getByTestId } = renderWithProvider(
      <HardwareWalletSignatures />,
      store,
    );

    expect(getByTestId('generic-hardware-wallet-animation')).toBeDefined();
  });

  it('advances to the second signature step when the approval transaction is in bridge history', () => {
    mockUseSubmitBridgeTransaction.mockReturnValue({
      submitBridgeTransaction: jest.fn().mockResolvedValue(undefined),
      isSubmitting: false,
    });
    const quote = DummyQuotesWithApproval.ETH_11_USDC_TO_ARB[0];
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
            selectedAccountGroup:
              'keyring:Ledger Hardware/0xb3864b298f4fddbbbd2fa5cf1a2a2748932b3b82',
          },
          txHistory: {
            'action-id': {
              approvalTxId: 'approval-tx-id',
              quote: { requestId: quote.quote.requestId },
            },
          },
        },
      }),
    );
    const { getByText, queryByText } = renderWithProvider(
      <HardwareWalletSignatures />,
      store,
    );

    expect(getByText('Confirm with your hardware wallet (2/2)')).toBeDefined();
    expect(queryByText('Transaction submitted')).toBeNull();
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
            selectedAccountGroup:
              'keyring:Ledger Hardware/0xb3864b298f4fddbbbd2fa5cf1a2a2748932b3b82',
          },
        },
      }),
    );
    const { getByText } = renderWithProvider(
      <HardwareWalletSignatures />,
      store,
    );

    expect(getByText('Confirm with your hardware wallet (1/2)')).toBeDefined();

    await act(async () => {
      onHardwareWalletSubmittedCallbacks[0]?.();
    });

    expect(getByText('Transaction submitted')).toBeDefined();
  });

  it('shows the active QR code inline for QR hardware wallets that need two signatures', () => {
    mockUseSubmitBridgeTransaction.mockReturnValue({
      submitBridgeTransaction: jest.fn().mockResolvedValue(undefined),
      isSubmitting: false,
    });
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
              selectedAccountGroup:
                'keyring:Ledger Hardware/0xb3864b298f4fddbbbd2fa5cf1a2a2748932b3b82',
            },
          },
        }),
      );
      return renderWithProvider(<HardwareWalletSignatures />, store);
    };

    it('shows "Transaction failed" when the device disconnects during signing', () => {
      mockUseSubmitBridgeTransaction.mockReturnValue({
        submitBridgeTransaction: jest.fn().mockResolvedValue(undefined),
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

      const { getAllByText, getByRole } = renderWithLedgerAccount();

      expect(getAllByText('Transaction failed').length).toBeGreaterThan(0);
      expect(getByRole('button', { name: 'Try again' })).toBeDefined();
    });

    it('shows "Transaction rejected" when the device reports a user rejection', () => {
      mockUseSubmitBridgeTransaction.mockReturnValue({
        submitBridgeTransaction: jest.fn().mockResolvedValue(undefined),
        isSubmitting: false,
      });
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
