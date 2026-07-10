import { QrScanRequestType } from '@metamask/eth-qr-keyring';
import { TextColor } from '@metamask/design-system-react';
import { providerErrors } from '@metamask/rpc-errors';
import { it } from '@jest/globals';
import { HardwareWalletSignatureStatus } from './hardware-wallet-signatures-state-machine';
import { SignatureStepStatus } from './types';
import {
  cleanupPendingApproval,
  getAllStepStatuses,
  getQrHardwareSigningPageTitle,
  getQrScanButtonLabelKey,
  getStepDescriptions,
  getStepLabelColor,
  getStepStatus,
  hasApprovalTxForRequestId,
  getTitle,
  getFinalStepLabel,
  getStepLabels,
  getFirstStepDescription,
  getFinalStepDescription,
  isErrorStepStatus,
  isQrHardwareSignRequest,
  getTransactionField,
} from './hardware-wallet-signatures.utils';

jest.mock('../../../store/actions', () => ({
  rejectPendingApproval: jest.fn(() => 'REJECT_ACTION'),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const mockRejectPendingApproval = jest.requireMock(
  '../../../store/actions',
).rejectPendingApproval;

const t = (key: string, params?: (string | undefined)[]) => {
  if (params) {
    return `${key}[${params.join(',')}]`;
  }
  return key;
};

describe('hardware-wallet-signatures utils', () => {
  describe('isErrorStepStatus', () => {
    it.each([
      SignatureStepStatus.Rejected,
      SignatureStepStatus.Failed,
      SignatureStepStatus.Disconnected,
    ])('returns true for %s', (status) => {
      expect(isErrorStepStatus(status)).toBe(true);
    });

    it.each([
      SignatureStepStatus.Pending,
      SignatureStepStatus.Active,
      SignatureStepStatus.Complete,
    ])('returns false for %s', (status) => {
      expect(isErrorStepStatus(status)).toBe(false);
    });
  });

  describe('getStepLabelColor', () => {
    it('returns ErrorDefault for error step statuses', () => {
      expect(getStepLabelColor(SignatureStepStatus.Rejected)).toBe(
        TextColor.ErrorDefault,
      );
      expect(getStepLabelColor(SignatureStepStatus.Failed)).toBe(
        TextColor.ErrorDefault,
      );
      expect(getStepLabelColor(SignatureStepStatus.Disconnected)).toBe(
        TextColor.ErrorDefault,
      );
    });

    it('returns TextDefault for non-error step statuses', () => {
      expect(getStepLabelColor(SignatureStepStatus.Pending)).toBe(
        TextColor.TextDefault,
      );
      expect(getStepLabelColor(SignatureStepStatus.Active)).toBe(
        TextColor.TextDefault,
      );
      expect(getStepLabelColor(SignatureStepStatus.Complete)).toBe(
        TextColor.TextDefault,
      );
    });
  });

  describe('getQrScanButtonLabelKey', () => {
    it('returns the final scan label key for the final signature', () => {
      expect(getQrScanButtonLabelKey(true)).toBe(
        'qrHardwareScanSignatureFinal',
      );
    });

    it('returns the next scan label key for a non-final signature', () => {
      expect(getQrScanButtonLabelKey(false)).toBe(
        'qrHardwareScanSignatureNext',
      );
    });
  });

  describe('hasApprovalTxForRequestId', () => {
    it('returns false when requestId is undefined', () => {
      expect(hasApprovalTxForRequestId({}, undefined)).toBe(false);
    });

    it('returns false when txHistory is undefined', () => {
      expect(hasApprovalTxForRequestId(undefined, 'request-1')).toBe(false);
    });

    it('returns true when the bridge history entry key matches the request id', () => {
      expect(
        hasApprovalTxForRequestId(
          {
            'request-1': {
              approvalTxId: 'approval-transaction-id',
              quote: {},
            },
          },
          'request-1',
        ),
      ).toBe(true);
    });

    it('returns true when the bridge history quote request id matches', () => {
      expect(
        hasApprovalTxForRequestId(
          {
            'history-entry-id': {
              approvalTxId: 'approval-transaction-id',
              quote: {
                requestId: 'request-1',
              },
            },
          },
          'request-1',
        ),
      ).toBe(true);
    });

    it('returns false when the matching history entry does not have an approval transaction id', () => {
      expect(
        hasApprovalTxForRequestId(
          {
            'request-1': {
              quote: {
                requestId: 'request-1',
              },
            },
          },
          'request-1',
        ),
      ).toBe(false);
    });

    it('returns false when no entries match', () => {
      expect(
        hasApprovalTxForRequestId(
          {
            'request-2': {
              approvalTxId: 'tx-1',
              quote: { requestId: 'request-2' },
            },
          },
          'request-1',
        ),
      ).toBe(false);
    });
  });

  describe('getStepStatus', () => {
    it('returns Complete when Submitted', () => {
      expect(
        getStepStatus(HardwareWalletSignatureStatus.AwaitingFirstSignature, {
          status: HardwareWalletSignatureStatus.Submitted,
        }),
      ).toBe(SignatureStepStatus.Complete);
    });

    it('returns Rejected when rejected signature matches step', () => {
      expect(
        getStepStatus(HardwareWalletSignatureStatus.AwaitingFirstSignature, {
          status: HardwareWalletSignatureStatus.Rejected,
          rejectedSignature:
            HardwareWalletSignatureStatus.AwaitingFirstSignature,
        }),
      ).toBe(SignatureStepStatus.Rejected);
    });

    it('returns Complete when first step rejected but current step is first (before final)', () => {
      expect(
        getStepStatus(HardwareWalletSignatureStatus.AwaitingFirstSignature, {
          status: HardwareWalletSignatureStatus.Rejected,
          rejectedSignature:
            HardwareWalletSignatureStatus.AwaitingFinalSignature,
        }),
      ).toBe(SignatureStepStatus.Complete);
    });

    it('returns Pending when final step rejected on first step', () => {
      expect(
        getStepStatus(HardwareWalletSignatureStatus.AwaitingFinalSignature, {
          status: HardwareWalletSignatureStatus.Rejected,
          rejectedSignature:
            HardwareWalletSignatureStatus.AwaitingFirstSignature,
        }),
      ).toBe(SignatureStepStatus.Pending);
    });

    it('returns Failed when failed signature matches step', () => {
      expect(
        getStepStatus(HardwareWalletSignatureStatus.AwaitingFinalSignature, {
          status: HardwareWalletSignatureStatus.Failed,
          failedSignature: HardwareWalletSignatureStatus.AwaitingFinalSignature,
        }),
      ).toBe(SignatureStepStatus.Failed);
    });

    it('returns Complete when failed on final step and checking first step', () => {
      expect(
        getStepStatus(HardwareWalletSignatureStatus.AwaitingFirstSignature, {
          status: HardwareWalletSignatureStatus.Failed,
          failedSignature: HardwareWalletSignatureStatus.AwaitingFinalSignature,
        }),
      ).toBe(SignatureStepStatus.Complete);
    });

    it('returns Disconnected when disconnected signature matches step', () => {
      expect(
        getStepStatus(HardwareWalletSignatureStatus.AwaitingFirstSignature, {
          status: HardwareWalletSignatureStatus.Disconnected,
          disconnectedSignature:
            HardwareWalletSignatureStatus.AwaitingFirstSignature,
        }),
      ).toBe(SignatureStepStatus.Disconnected);
    });

    it('returns Complete when disconnected on final step and checking first step', () => {
      expect(
        getStepStatus(HardwareWalletSignatureStatus.AwaitingFirstSignature, {
          status: HardwareWalletSignatureStatus.Disconnected,
          disconnectedSignature:
            HardwareWalletSignatureStatus.AwaitingFinalSignature,
        }),
      ).toBe(SignatureStepStatus.Complete);
    });

    it('returns Pending when disconnected on first step but checking final', () => {
      expect(
        getStepStatus(HardwareWalletSignatureStatus.AwaitingFinalSignature, {
          status: HardwareWalletSignatureStatus.Disconnected,
          disconnectedSignature:
            HardwareWalletSignatureStatus.AwaitingFirstSignature,
        }),
      ).toBe(SignatureStepStatus.Pending);
    });

    it('returns Active when step matches current state', () => {
      expect(
        getStepStatus(HardwareWalletSignatureStatus.AwaitingFirstSignature, {
          status: HardwareWalletSignatureStatus.AwaitingFirstSignature,
        }),
      ).toBe(SignatureStepStatus.Active);
    });

    it('returns Complete when first step and state is AwaitingFinalSignature', () => {
      expect(
        getStepStatus(HardwareWalletSignatureStatus.AwaitingFirstSignature, {
          status: HardwareWalletSignatureStatus.AwaitingFinalSignature,
        }),
      ).toBe(SignatureStepStatus.Complete);
    });

    it('returns Pending for unrelated step', () => {
      expect(
        getStepStatus(HardwareWalletSignatureStatus.AwaitingFinalSignature, {
          status: HardwareWalletSignatureStatus.AwaitingFirstSignature,
        }),
      ).toBe(SignatureStepStatus.Pending);
    });
  });

  describe('getAllStepStatuses', () => {
    it('returns Active and Pending while awaiting the first signature', () => {
      expect(
        getAllStepStatuses({
          status: HardwareWalletSignatureStatus.AwaitingFirstSignature,
        }),
      ).toEqual({
        first: SignatureStepStatus.Active,
        final: SignatureStepStatus.Pending,
      });
    });

    it('returns Complete and Active while awaiting the final signature', () => {
      expect(
        getAllStepStatuses({
          status: HardwareWalletSignatureStatus.AwaitingFinalSignature,
        }),
      ).toEqual({
        first: SignatureStepStatus.Complete,
        final: SignatureStepStatus.Active,
      });
    });

    it('returns Complete for both steps when submitted', () => {
      expect(
        getAllStepStatuses({
          status: HardwareWalletSignatureStatus.Submitted,
        }),
      ).toEqual({
        first: SignatureStepStatus.Complete,
        final: SignatureStepStatus.Complete,
      });
    });

    it('marks only the interrupted step as Rejected', () => {
      expect(
        getAllStepStatuses({
          status: HardwareWalletSignatureStatus.Rejected,
          rejectedSignature:
            HardwareWalletSignatureStatus.AwaitingFinalSignature,
        }),
      ).toEqual({
        first: SignatureStepStatus.Complete,
        final: SignatureStepStatus.Rejected,
      });
    });
  });

  describe('getTitle', () => {
    it('returns submitted title', () => {
      expect(
        getTitle({
          status: HardwareWalletSignatureStatus.Submitted,
          needsTwoConfirmations: false,
          t,
        }),
      ).toBe('hardwareAllSetTitle');
    });

    it('returns rejected title', () => {
      expect(
        getTitle({
          status: HardwareWalletSignatureStatus.Rejected,
          needsTwoConfirmations: false,
          t,
        }),
      ).toBe('hardwareTransactionRejected');
    });

    it('returns failed title', () => {
      expect(
        getTitle({
          status: HardwareWalletSignatureStatus.Failed,
          needsTwoConfirmations: false,
          t,
        }),
      ).toBe('transactionFailed');
    });

    it('returns disconnected title', () => {
      expect(
        getTitle({
          status: HardwareWalletSignatureStatus.Disconnected,
          needsTwoConfirmations: false,
          t,
        }),
      ).toBe('hardwareDeviceDisconnected');
    });

    it('returns almost there title when needs two confirmations and awaiting final', () => {
      expect(
        getTitle({
          status: HardwareWalletSignatureStatus.AwaitingFinalSignature,
          needsTwoConfirmations: true,
          t,
        }),
      ).toBe('hardwareAlmostThereTitle');
    });

    it('returns default confirm title', () => {
      expect(
        getTitle({
          status: HardwareWalletSignatureStatus.AwaitingFirstSignature,
          needsTwoConfirmations: false,
          t,
        }),
      ).toBe('swapConfirmWithHwWallet');
    });

    it('returns default confirm title when needs two confirmations but on first step', () => {
      expect(
        getTitle({
          status: HardwareWalletSignatureStatus.AwaitingFirstSignature,
          needsTwoConfirmations: true,
          t,
        }),
      ).toBe('swapConfirmWithHwWallet');
    });
  });

  describe('getQrHardwareSigningPageTitle', () => {
    describe('two-confirmation flow', () => {
      it('returns display step 1 of 4 for approval display', () => {
        expect(
          getQrHardwareSigningPageTitle({
            activeQrStep: HardwareWalletSignatureStatus.AwaitingFirstSignature,
            isDisplayPhase: true,
            needsTwoConfirmations: true,
            t,
          }),
        ).toBe('bridgeQrHardwareSignDisplayStepTitle[1,4]');
      });

      it('returns scan step 2 of 4 for approval scan', () => {
        expect(
          getQrHardwareSigningPageTitle({
            activeQrStep: HardwareWalletSignatureStatus.AwaitingFirstSignature,
            isDisplayPhase: false,
            needsTwoConfirmations: true,
            t,
          }),
        ).toBe('bridgeQrHardwareSignStepTitle[2,4]');
      });

      it('returns display step 3 of 4 for trade display', () => {
        expect(
          getQrHardwareSigningPageTitle({
            activeQrStep: HardwareWalletSignatureStatus.AwaitingFinalSignature,
            isDisplayPhase: true,
            needsTwoConfirmations: true,
            t,
          }),
        ).toBe('bridgeQrHardwareSignDisplayStepTitle[3,4]');
      });

      it('returns last-step title for trade scan', () => {
        expect(
          getQrHardwareSigningPageTitle({
            activeQrStep: HardwareWalletSignatureStatus.AwaitingFinalSignature,
            isDisplayPhase: false,
            needsTwoConfirmations: true,
            t,
          }),
        ).toBe('bridgeQrHardwareSignLastStepTitle');
      });
    });

    describe('single-confirmation flow', () => {
      it('returns display step 1 of 2', () => {
        expect(
          getQrHardwareSigningPageTitle({
            activeQrStep: HardwareWalletSignatureStatus.AwaitingFinalSignature,
            isDisplayPhase: true,
            needsTwoConfirmations: false,
            t,
          }),
        ).toBe('bridgeQrHardwareSignDisplayStepTitle[1,2]');
      });

      it('returns last-step title for the final scan', () => {
        expect(
          getQrHardwareSigningPageTitle({
            activeQrStep: HardwareWalletSignatureStatus.AwaitingFinalSignature,
            isDisplayPhase: false,
            needsTwoConfirmations: false,
            t,
          }),
        ).toBe('bridgeQrHardwareSignLastStepTitle');
      });

      it('defaults to the scan phase when isDisplayPhase is omitted', () => {
        expect(
          getQrHardwareSigningPageTitle({
            activeQrStep: HardwareWalletSignatureStatus.AwaitingFirstSignature,
            needsTwoConfirmations: false,
            t,
          }),
        ).toBe('bridgeQrHardwareSignLastStepTitle');
      });
    });
  });

  describe('getFinalStepLabel', () => {
    it('returns sent amount when submitted', () => {
      expect(
        getFinalStepLabel({
          status: HardwareWalletSignatureStatus.Submitted,
          finalStepStatus: SignatureStepStatus.Complete,
          fromAmount: '1.5',
          fromTokenSymbol: 'ETH',
          t,
        }),
      ).toBe('hardwareSentAmount[1.5,ETH]');
    });

    it('returns sending amount when active', () => {
      expect(
        getFinalStepLabel({
          status: HardwareWalletSignatureStatus.AwaitingFinalSignature,
          finalStepStatus: SignatureStepStatus.Active,
          fromAmount: '1.5',
          fromTokenSymbol: 'ETH',
          t,
        }),
      ).toBe('hardwareSendingAmount[1.5,ETH]');
    });

    it('returns send amount when pending', () => {
      expect(
        getFinalStepLabel({
          status: HardwareWalletSignatureStatus.AwaitingFinalSignature,
          finalStepStatus: SignatureStepStatus.Pending,
          fromAmount: '1.5',
          fromTokenSymbol: 'ETH',
          t,
        }),
      ).toBe('hardwareSendAmount[1.5,ETH]');
    });
  });

  describe('getStepLabels', () => {
    const sendBundleBase = {
      isSendBundleFlow: true,
      sendAmount: '1.5',
      sendSymbol: 'USDC',
      gasSymbol: 'ETH',
      fromAmount: undefined,
      fromTokenSymbol: undefined,
      t,
    };

    describe('sendBundle two-confirmation flow', () => {
      it('uses Sending for the active send step and gas payment for the final step', () => {
        expect(
          getStepLabels({
            ...sendBundleBase,
            needsTwoConfirmations: true,
            status: HardwareWalletSignatureStatus.AwaitingFirstSignature,
            firstStepStatus: SignatureStepStatus.Active,
            finalStepStatus: SignatureStepStatus.Pending,
          }),
        ).toEqual({
          firstStepLabel: 'hardwareSendingAmount[1.5,USDC]',
          finalStepLabel: 'sendBundleHwGasPayment[ETH]',
        });
      });

      it('uses Sent for a completed send step', () => {
        expect(
          getStepLabels({
            ...sendBundleBase,
            needsTwoConfirmations: true,
            status: HardwareWalletSignatureStatus.AwaitingFinalSignature,
            firstStepStatus: SignatureStepStatus.Complete,
            finalStepStatus: SignatureStepStatus.Active,
          }),
        ).toEqual({
          firstStepLabel: 'hardwareSentAmount[1.5,USDC]',
          finalStepLabel: 'sendBundleHwGasPayment[ETH]',
        });
      });

      it('uses Send for a pending send step', () => {
        expect(
          getStepLabels({
            ...sendBundleBase,
            needsTwoConfirmations: true,
            status: HardwareWalletSignatureStatus.AwaitingFirstSignature,
            firstStepStatus: SignatureStepStatus.Pending,
            finalStepStatus: SignatureStepStatus.Pending,
          }),
        ).toEqual({
          firstStepLabel: 'hardwareSendAmount[1.5,USDC]',
          finalStepLabel: 'sendBundleHwGasPayment[ETH]',
        });
      });

      it('uses Sent when the flow is submitted', () => {
        expect(
          getStepLabels({
            ...sendBundleBase,
            needsTwoConfirmations: true,
            status: HardwareWalletSignatureStatus.Submitted,
            firstStepStatus: SignatureStepStatus.Complete,
            finalStepStatus: SignatureStepStatus.Complete,
          }),
        ).toEqual({
          firstStepLabel: 'hardwareSentAmount[1.5,USDC]',
          finalStepLabel: 'sendBundleHwGasPayment[ETH]',
        });
      });
    });

    describe('sendBundle single-confirmation flow', () => {
      it('uses Sending when the send step is active', () => {
        expect(
          getStepLabels({
            ...sendBundleBase,
            needsTwoConfirmations: false,
            status: HardwareWalletSignatureStatus.AwaitingFinalSignature,
            firstStepStatus: SignatureStepStatus.Pending,
            finalStepStatus: SignatureStepStatus.Active,
          }),
        ).toEqual({
          firstStepLabel: 'hardwareSendingAmount[1.5,USDC]',
          finalStepLabel: 'hardwareSendingAmount[1.5,USDC]',
        });
      });

      it('uses Sent when the send step is complete', () => {
        expect(
          getStepLabels({
            ...sendBundleBase,
            needsTwoConfirmations: false,
            status: HardwareWalletSignatureStatus.Submitted,
            firstStepStatus: SignatureStepStatus.Complete,
            finalStepStatus: SignatureStepStatus.Complete,
          }),
        ).toEqual({
          firstStepLabel: 'hardwareSentAmount[1.5,USDC]',
          finalStepLabel: 'hardwareSentAmount[1.5,USDC]',
        });
      });

      it('uses Send when the send step is pending', () => {
        expect(
          getStepLabels({
            ...sendBundleBase,
            needsTwoConfirmations: false,
            status: HardwareWalletSignatureStatus.AwaitingFinalSignature,
            firstStepStatus: SignatureStepStatus.Pending,
            finalStepStatus: SignatureStepStatus.Pending,
          }),
        ).toEqual({
          firstStepLabel: 'hardwareSendAmount[1.5,USDC]',
          finalStepLabel: 'hardwareSendAmount[1.5,USDC]',
        });
      });
    });

    describe('bridge/swap flow', () => {
      it('uses Approved and Sent when submitted', () => {
        expect(
          getStepLabels({
            isSendBundleFlow: false,
            needsTwoConfirmations: true,
            status: HardwareWalletSignatureStatus.Submitted,
            firstStepStatus: SignatureStepStatus.Complete,
            finalStepStatus: SignatureStepStatus.Complete,
            fromAmount: '1.5',
            fromTokenSymbol: 'ETH',
            t,
          }),
        ).toEqual({
          firstStepLabel: 'hardwareApprovedAmount[1.5,ETH]',
          finalStepLabel: 'hardwareSentAmount[1.5,ETH]',
        });
      });

      it('uses Approve and Sending when the final step is active', () => {
        expect(
          getStepLabels({
            isSendBundleFlow: false,
            needsTwoConfirmations: true,
            status: HardwareWalletSignatureStatus.AwaitingFinalSignature,
            firstStepStatus: SignatureStepStatus.Complete,
            finalStepStatus: SignatureStepStatus.Active,
            fromAmount: '1.5',
            fromTokenSymbol: 'ETH',
            t,
          }),
        ).toEqual({
          firstStepLabel: 'hardwareApprovedAmount[1.5,ETH]',
          finalStepLabel: 'hardwareSendingAmount[1.5,ETH]',
        });
      });

      it('uses Approve when the first step is still active', () => {
        expect(
          getStepLabels({
            isSendBundleFlow: false,
            needsTwoConfirmations: true,
            status: HardwareWalletSignatureStatus.AwaitingFirstSignature,
            firstStepStatus: SignatureStepStatus.Active,
            finalStepStatus: SignatureStepStatus.Pending,
            fromAmount: '1.5',
            fromTokenSymbol: 'ETH',
            t,
          }),
        ).toEqual({
          firstStepLabel: 'hardwareApproveAmount[1.5,ETH]',
          finalStepLabel: 'hardwareSendAmount[1.5,ETH]',
        });
      });
    });
  });

  describe('getStepDescriptions', () => {
    const toAddress = '0x1234567890abcdef1234567890abcdef12345678';
    const spenderAddress = '0xabcdef1234567890abcdef1234567890abcdef12';

    describe('sendBundle two-confirmation flow', () => {
      it('shows the destination on the first step and omits the final description', () => {
        expect(
          getStepDescriptions({
            isSendBundleFlow: true,
            needsTwoConfirmations: true,
            firstStepStatus: SignatureStepStatus.Active,
            toAddress,
            t,
          }),
        ).toEqual({
          firstStepDescription: 'hardwareToAddress[0x12345...45678]',
          finalStepDescription: undefined,
        });
      });
    });

    describe('sendBundle single-confirmation flow', () => {
      it('shows the destination on the final step only', () => {
        expect(
          getStepDescriptions({
            isSendBundleFlow: true,
            needsTwoConfirmations: false,
            firstStepStatus: SignatureStepStatus.Pending,
            toAddress,
            t,
          }),
        ).toEqual({
          finalStepDescription: 'hardwareToAddress[0x12345...45678]',
        });
      });
    });

    describe('bridge/swap flow', () => {
      it('delegates to first- and final-step descriptions', () => {
        expect(
          getStepDescriptions({
            isSendBundleFlow: false,
            needsTwoConfirmations: true,
            firstStepStatus: SignatureStepStatus.Active,
            spenderAddress,
            toAddress,
            t,
          }),
        ).toEqual({
          firstStepDescription: 'hardwareSpender[0xabcde...def12]',
          finalStepDescription: 'hardwareToAddress[0x12345...45678]',
        });
      });

      it('surfaces rejection on the first step', () => {
        expect(
          getStepDescriptions({
            isSendBundleFlow: false,
            needsTwoConfirmations: true,
            firstStepStatus: SignatureStepStatus.Rejected,
            spenderAddress,
            toAddress,
            t,
          }),
        ).toEqual({
          firstStepDescription: 'hardwareRejected',
          finalStepDescription: 'hardwareToAddress[0x12345...45678]',
        });
      });
    });
  });

  describe('getFirstStepDescription', () => {
    it('returns rejected text', () => {
      expect(
        getFirstStepDescription({
          firstStepStatus: SignatureStepStatus.Rejected,
          spenderAddress: '0x123',
          t,
        }),
      ).toBe('hardwareRejected');
    });

    it('returns reconnect text', () => {
      expect(
        getFirstStepDescription({
          firstStepStatus: SignatureStepStatus.Disconnected,
          spenderAddress: '0x123',
          t,
        }),
      ).toBe('hardwareReconnectDevice');
    });

    it('returns failed text', () => {
      expect(
        getFirstStepDescription({
          firstStepStatus: SignatureStepStatus.Failed,
          spenderAddress: '0x123',
          t,
        }),
      ).toBe('transactionFailed');
    });

    it('returns spender address text', () => {
      expect(
        getFirstStepDescription({
          firstStepStatus: SignatureStepStatus.Active,
          spenderAddress: '0x1234567890abcdef1234567890abcdef12345678',
          t,
        }),
      ).toBe('hardwareSpender[0x12345...45678]');
    });

    it('returns undefined when no spender address', () => {
      expect(
        getFirstStepDescription({
          firstStepStatus: SignatureStepStatus.Active,
          spenderAddress: undefined,
          t,
        }),
      ).toBeUndefined();
    });
  });

  describe('getFinalStepDescription', () => {
    it('returns to address text', () => {
      expect(
        getFinalStepDescription({
          toAddress: '0x1234567890abcdef1234567890abcdef12345678',
          t,
        }),
      ).toBe('hardwareToAddress[0x12345...45678]');
    });

    it('returns undefined when no to address', () => {
      expect(
        getFinalStepDescription({
          toAddress: undefined,
          t,
        }),
      ).toBeUndefined();
    });
  });

  describe('isQrHardwareSignRequest', () => {
    it('returns false for null', () => {
      expect(isQrHardwareSignRequest(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isQrHardwareSignRequest(undefined)).toBe(false);
    });

    it('returns false for plain object', () => {
      expect(isQrHardwareSignRequest({})).toBe(false);
    });

    it('returns false for wrong type', () => {
      expect(
        isQrHardwareSignRequest({
          type: 'wrong-type',
          request: {
            requestId: 'id',
            payload: { type: 't', cbor: 'c' },
          },
        }),
      ).toBe(false);
    });

    it('returns false when request is missing', () => {
      expect(
        isQrHardwareSignRequest({
          type: QrScanRequestType.SIGN,
        }),
      ).toBe(false);
    });

    it('returns false when requestId is not a string', () => {
      expect(
        isQrHardwareSignRequest({
          type: QrScanRequestType.SIGN,
          request: {
            requestId: 123,
            payload: { type: 't', cbor: 'c' },
          },
        }),
      ).toBe(false);
    });

    it('returns false when payload is missing', () => {
      expect(
        isQrHardwareSignRequest({
          type: QrScanRequestType.SIGN,
          request: {
            requestId: 'id',
          },
        }),
      ).toBe(false);
    });

    it('returns false for uppercase QR sign request type', () => {
      expect(
        isQrHardwareSignRequest({
          type: 'SIGN',
          request: {
            requestId: 'request-id-123',
            payload: {
              type: 'eth-sign-request',
              cbor: 'a201010203',
            },
          },
        }),
      ).toBe(false);
    });

    it('returns true for valid QR sign request', () => {
      expect(
        isQrHardwareSignRequest({
          type: QrScanRequestType.SIGN,
          request: {
            requestId: 'request-id-123',
            payload: {
              type: 'eth-sign-request',
              cbor: 'a201010203',
            },
          },
        }),
      ).toBe(true);
    });
  });

  describe('getTransactionField', () => {
    it('returns field value when present', () => {
      expect(getTransactionField({ from: '0xabc' }, 'from')).toBe('0xabc');
    });

    it('returns field value for "to" field', () => {
      expect(getTransactionField({ to: '0xdef' }, 'to')).toBe('0xdef');
    });

    it('returns undefined when transaction is null', () => {
      expect(getTransactionField(null, 'from')).toBeUndefined();
    });

    it('returns undefined when transaction is undefined', () => {
      expect(getTransactionField(undefined, 'from')).toBeUndefined();
    });

    it('returns undefined when field is not present', () => {
      expect(getTransactionField({ from: '0xabc' }, 'to')).toBeUndefined();
    });

    it('returns undefined when field value is not a string', () => {
      expect(getTransactionField({ from: 123 }, 'from')).toBeUndefined();
    });
  });

  describe('cleanupPendingApproval', () => {
    const dispatch = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('dispatches rejectPendingApproval with a user-rejected error', () => {
      cleanupPendingApproval(dispatch as never, 'approval-123');

      expect(mockRejectPendingApproval).toHaveBeenCalledWith(
        'approval-123',
        expect.objectContaining({
          code: providerErrors.userRejectedRequest().code,
          message: providerErrors.userRejectedRequest().message,
        }),
      );
      expect(dispatch).toHaveBeenCalledWith('REJECT_ACTION');
    });
  });
});
