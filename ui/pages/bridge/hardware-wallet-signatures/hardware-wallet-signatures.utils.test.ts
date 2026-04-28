import {
  HardwareWalletSignatureStatus,
  type HardwareWalletSignaturesState,
} from './hardware-wallet-signatures-state-machine';
import {
  SignatureStepStatus,
  getStepStatus,
  hasApprovalTxForRequestId,
} from './hardware-wallet-signatures.utils';

describe('hardware-wallet-signatures utils', () => {
  describe('hasApprovalTxForRequestId', () => {
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
  });

  describe('getStepStatus', () => {
    it.each([
      {
        state: {
          status: HardwareWalletSignatureStatus.Rejected,
          rejectedSignature:
            HardwareWalletSignatureStatus.AwaitingFinalSignature,
        },
        expectedStatus: SignatureStepStatus.Complete,
      },
      {
        state: {
          status: HardwareWalletSignatureStatus.Failed,
          failedSignature: HardwareWalletSignatureStatus.AwaitingFinalSignature,
        },
        expectedStatus: SignatureStepStatus.Complete,
      },
    ] as {
      state: HardwareWalletSignaturesState;
      expectedStatus: SignatureStepStatus;
    }[])(
      'marks the first signature as complete when the final signature is $state.status',
      ({ state, expectedStatus }) => {
        expect(
          getStepStatus(
            HardwareWalletSignatureStatus.AwaitingFirstSignature,
            state,
          ),
        ).toBe(expectedStatus);
      },
    );
  });
});
