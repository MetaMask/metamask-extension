import React from 'react';
import { act } from '@testing-library/react';
import { QrScanRequestType } from '@metamask/eth-qr-keyring';
import configureStore from '../../../store/store';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import {
  createBridgeMockStore,
  MOCK_LEDGER_ACCOUNT,
} from '../../../../test/data/bridge/mock-bridge-store';
import { DummyQuotesWithApproval } from '../../../../test/data/bridge/dummy-quotes';
import { HardwareKeyringType } from '../../../../shared/constants/hardware-wallets';
import useSubmitBridgeTransaction from '../hooks/useSubmitBridgeTransaction';
import HardwareWalletSignatures from '.';

jest.mock('../hooks/useSubmitBridgeTransaction');

const mockUseSubmitBridgeTransaction =
  useSubmitBridgeTransaction as jest.MockedFunction<
    typeof useSubmitBridgeTransaction
  >;

describe('HardwareWalletSignatures', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('waits for the second signature after the approval signature is submitted', async () => {
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
    const { getByText, queryByText } = renderWithProvider(
      <HardwareWalletSignatures />,
      store,
    );

    expect(getByText('Confirm with your hardware wallet (1/2)')).toBeDefined();

    await act(async () => {
      onHardwareWalletSubmittedCallbacks[0]?.();
    });

    expect(getByText('Confirm with your hardware wallet (2/2)')).toBeDefined();
    expect(queryByText('Transaction submitted')).toBeNull();

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
});
