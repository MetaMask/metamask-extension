import {
  HardwareWalletSignatureStatus,
  type HardwareWalletSignaturesState,
} from './hardware-wallet-signatures-state-machine';
import {
  SignatureStepStatus,
  getStepStatus,
  hasApprovalTxForRequestId,
  getTitle,
  getFinalStepLabel,
  getFirstStepDescription,
  getFinalStepDescription,
  isQrHardwareSignRequest,
  getTransactionField,
} from './hardware-wallet-signatures.utils';

const t = (key: string, params?: (string | undefined)[]) => {
  if (params) return `${key}[${params.join(',')}]`;
  return key;
};

describe('hardware-wallet-signatures utils', () => {
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
          rejectedSignature: HardwareWalletSignatureStatus.AwaitingFirstSignature,
        }),
      ).toBe(SignatureStepStatus.Rejected);
    });

    it('returns Complete when first step rejected but current step is first (before final)', () => {
      expect(
        getStepStatus(
          HardwareWalletSignatureStatus.AwaitingFirstSignature,
          {
            status: HardwareWalletSignatureStatus.Rejected,
            rejectedSignature:
              HardwareWalletSignatureStatus.AwaitingFinalSignature,
          },
        ),
      ).toBe(SignatureStepStatus.Complete);
    });

    it('returns Pending when final step rejected on first step', () => {
      expect(
        getStepStatus(
          HardwareWalletSignatureStatus.AwaitingFinalSignature,
          {
            status: HardwareWalletSignatureStatus.Rejected,
            rejectedSignature:
              HardwareWalletSignatureStatus.AwaitingFirstSignature,
          },
        ),
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
        getStepStatus(
          HardwareWalletSignatureStatus.AwaitingFirstSignature,
          {
            status: HardwareWalletSignatureStatus.Failed,
            failedSignature:
              HardwareWalletSignatureStatus.AwaitingFinalSignature,
          },
        ),
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
        getStepStatus(
          HardwareWalletSignatureStatus.AwaitingFirstSignature,
          {
            status: HardwareWalletSignatureStatus.Disconnected,
            disconnectedSignature:
              HardwareWalletSignatureStatus.AwaitingFinalSignature,
          },
        ),
      ).toBe(SignatureStepStatus.Complete);
    });

    it('returns Pending when disconnected on first step but checking final', () => {
      expect(
        getStepStatus(
          HardwareWalletSignatureStatus.AwaitingFinalSignature,
          {
            status: HardwareWalletSignatureStatus.Disconnected,
            disconnectedSignature:
              HardwareWalletSignatureStatus.AwaitingFirstSignature,
          },
        ),
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

  describe('getTitle', () => {
    it('returns submitted title', () => {
      expect(
        getTitle({
          status: HardwareWalletSignatureStatus.Submitted,
          needsTwoConfirmations: false,
          t,
        }),
      ).toBe('bridgeHwAllSetTitle');
    });

    it('returns rejected title', () => {
      expect(
        getTitle({
          status: HardwareWalletSignatureStatus.Rejected,
          needsTwoConfirmations: false,
          t,
        }),
      ).toBe('bridgeHwTransactionRejected');
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
      ).toBe('bridgeHwDeviceDisconnected');
    });

    it('returns almost there title when needs two confirmations and awaiting final', () => {
      expect(
        getTitle({
          status: HardwareWalletSignatureStatus.AwaitingFinalSignature,
          needsTwoConfirmations: true,
          t,
        }),
      ).toBe('bridgeHwAlmostThereTitle');
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
      ).toBe('bridgeHwSentAmount[1.5,ETH]');
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
      ).toBe('bridgeHwSendingAmount[1.5,ETH]');
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
      ).toBe('bridgeHwSendAmount[1.5,ETH]');
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
      ).toBe('bridgeHwRejected');
    });

    it('returns reconnect text', () => {
      expect(
        getFirstStepDescription({
          firstStepStatus: SignatureStepStatus.Disconnected,
          spenderAddress: '0x123',
          t,
        }),
      ).toBe('bridgeHwReconnectDevice');
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
      ).toBe('bridgeHwSpender[0x12345...45678]');
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
      ).toBe('bridgeHwToAddress[0x12345...45678]');
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
          type: 'sign',
        }),
      ).toBe(false);
    });

    it('returns false when requestId is not a string', () => {
      expect(
        isQrHardwareSignRequest({
          type: 'sign',
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
          type: 'sign',
          request: {
            requestId: 'id',
          },
        }),
      ).toBe(false);
    });

    it('returns true for valid QR sign request', () => {
      expect(
        isQrHardwareSignRequest({
          type: 'sign',
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
});
