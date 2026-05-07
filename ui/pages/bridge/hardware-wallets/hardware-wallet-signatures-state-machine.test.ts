import {
  HardwareWalletSignatureEvent,
  HardwareWalletSignatureStatus,
  getInitialHardwareWalletSignaturesState,
  hardwareWalletSignaturesReducer,
} from './hardware-wallet-signatures-state-machine';

describe('hardwareWalletSignaturesReducer', () => {
  describe('getInitialHardwareWalletSignaturesState', () => {
    it('starts on the first signature when approval is required', () => {
      expect(getInitialHardwareWalletSignaturesState(true)).toStrictEqual({
        status: HardwareWalletSignatureStatus.AwaitingFirstSignature,
      });
    });

    it('starts on the final signature when approval is not required', () => {
      expect(getInitialHardwareWalletSignaturesState(false)).toStrictEqual({
        status: HardwareWalletSignatureStatus.AwaitingFinalSignature,
      });
    });
  });

  describe('FirstSignatureSubmitted', () => {
    it('advances from the first signature to the final signature', () => {
      expect(
        hardwareWalletSignaturesReducer(
          { status: HardwareWalletSignatureStatus.AwaitingFirstSignature },
          { type: HardwareWalletSignatureEvent.FirstSignatureSubmitted },
        ),
      ).toStrictEqual({
        status: HardwareWalletSignatureStatus.AwaitingFinalSignature,
      });
    });

    it('ignores FirstSignatureSubmitted when already Submitted', () => {
      expect(
        hardwareWalletSignaturesReducer(
          { status: HardwareWalletSignatureStatus.Submitted },
          { type: HardwareWalletSignatureEvent.FirstSignatureSubmitted },
        ),
      ).toStrictEqual({
        status: HardwareWalletSignatureStatus.Submitted,
      });
    });

    it('ignores FirstSignatureSubmitted when in AwaitingFinalSignature', () => {
      expect(
        hardwareWalletSignaturesReducer(
          { status: HardwareWalletSignatureStatus.AwaitingFinalSignature },
          { type: HardwareWalletSignatureEvent.FirstSignatureSubmitted },
        ),
      ).toStrictEqual({
        status: HardwareWalletSignatureStatus.AwaitingFinalSignature,
      });
    });

    it('ignores FirstSignatureSubmitted when Rejected', () => {
      expect(
        hardwareWalletSignaturesReducer(
          {
            status: HardwareWalletSignatureStatus.Rejected,
            rejectedSignature:
              HardwareWalletSignatureStatus.AwaitingFirstSignature,
          },
          { type: HardwareWalletSignatureEvent.FirstSignatureSubmitted },
        ),
      ).toStrictEqual({
        status: HardwareWalletSignatureStatus.Rejected,
        rejectedSignature: HardwareWalletSignatureStatus.AwaitingFirstSignature,
      });
    });
  });

  describe('TransactionSubmitted', () => {
    it('marks the transaction as submitted from AwaitingFinalSignature', () => {
      expect(
        hardwareWalletSignaturesReducer(
          { status: HardwareWalletSignatureStatus.AwaitingFinalSignature },
          { type: HardwareWalletSignatureEvent.TransactionSubmitted },
        ),
      ).toStrictEqual({
        status: HardwareWalletSignatureStatus.Submitted,
      });
    });

    it('advances directly from AwaitingFirstSignature to Submitted', () => {
      expect(
        hardwareWalletSignaturesReducer(
          { status: HardwareWalletSignatureStatus.AwaitingFirstSignature },
          { type: HardwareWalletSignatureEvent.TransactionSubmitted },
        ),
      ).toStrictEqual({
        status: HardwareWalletSignatureStatus.Submitted,
      });
    });

    it('ignores TransactionSubmitted when already Submitted', () => {
      expect(
        hardwareWalletSignaturesReducer(
          { status: HardwareWalletSignatureStatus.Submitted },
          { type: HardwareWalletSignatureEvent.TransactionSubmitted },
        ),
      ).toStrictEqual({
        status: HardwareWalletSignatureStatus.Submitted,
      });
    });

    it('ignores TransactionSubmitted when Rejected', () => {
      expect(
        hardwareWalletSignaturesReducer(
          {
            status: HardwareWalletSignatureStatus.Rejected,
            rejectedSignature:
              HardwareWalletSignatureStatus.AwaitingFirstSignature,
          },
          { type: HardwareWalletSignatureEvent.TransactionSubmitted },
        ),
      ).toStrictEqual({
        status: HardwareWalletSignatureStatus.Rejected,
        rejectedSignature: HardwareWalletSignatureStatus.AwaitingFirstSignature,
      });
    });
  });

  describe('TransactionRejected', () => {
    it('marks the active first signature as rejected', () => {
      expect(
        hardwareWalletSignaturesReducer(
          { status: HardwareWalletSignatureStatus.AwaitingFirstSignature },
          { type: HardwareWalletSignatureEvent.TransactionRejected },
        ),
      ).toStrictEqual({
        status: HardwareWalletSignatureStatus.Rejected,
        rejectedSignature: HardwareWalletSignatureStatus.AwaitingFirstSignature,
      });
    });

    it('marks the active final signature as rejected', () => {
      expect(
        hardwareWalletSignaturesReducer(
          { status: HardwareWalletSignatureStatus.AwaitingFinalSignature },
          { type: HardwareWalletSignatureEvent.TransactionRejected },
        ),
      ).toStrictEqual({
        status: HardwareWalletSignatureStatus.Rejected,
        rejectedSignature: HardwareWalletSignatureStatus.AwaitingFinalSignature,
      });
    });

    it('ignores TransactionRejected when already Submitted', () => {
      expect(
        hardwareWalletSignaturesReducer(
          { status: HardwareWalletSignatureStatus.Submitted },
          { type: HardwareWalletSignatureEvent.TransactionRejected },
        ),
      ).toStrictEqual({
        status: HardwareWalletSignatureStatus.Submitted,
      });
    });

    it('ignores TransactionRejected when already Rejected', () => {
      expect(
        hardwareWalletSignaturesReducer(
          {
            status: HardwareWalletSignatureStatus.Rejected,
            rejectedSignature:
              HardwareWalletSignatureStatus.AwaitingFirstSignature,
          },
          { type: HardwareWalletSignatureEvent.TransactionRejected },
        ),
      ).toStrictEqual({
        status: HardwareWalletSignatureStatus.Rejected,
        rejectedSignature: HardwareWalletSignatureStatus.AwaitingFirstSignature,
      });
    });

    it('ignores TransactionRejected when Failed', () => {
      expect(
        hardwareWalletSignaturesReducer(
          {
            status: HardwareWalletSignatureStatus.Failed,
            failedSignature:
              HardwareWalletSignatureStatus.AwaitingFirstSignature,
          },
          { type: HardwareWalletSignatureEvent.TransactionRejected },
        ),
      ).toStrictEqual({
        status: HardwareWalletSignatureStatus.Failed,
        failedSignature: HardwareWalletSignatureStatus.AwaitingFirstSignature,
      });
    });

    it('transitions from Disconnected to Rejected on TransactionRejected', () => {
      expect(
        hardwareWalletSignaturesReducer(
          {
            status: HardwareWalletSignatureStatus.Disconnected,
            disconnectedSignature:
              HardwareWalletSignatureStatus.AwaitingFirstSignature,
          },
          { type: HardwareWalletSignatureEvent.TransactionRejected },
        ),
      ).toStrictEqual({
        status: HardwareWalletSignatureStatus.Rejected,
        rejectedSignature: HardwareWalletSignatureStatus.AwaitingFirstSignature,
      });
    });
  });

  describe('TransactionFailed', () => {
    it('marks the active signature as failed', () => {
      expect(
        hardwareWalletSignaturesReducer(
          { status: HardwareWalletSignatureStatus.AwaitingFinalSignature },
          { type: HardwareWalletSignatureEvent.TransactionFailed },
        ),
      ).toStrictEqual({
        status: HardwareWalletSignatureStatus.Failed,
        failedSignature: HardwareWalletSignatureStatus.AwaitingFinalSignature,
      });
    });

    it('marks the first signature as failed', () => {
      expect(
        hardwareWalletSignaturesReducer(
          { status: HardwareWalletSignatureStatus.AwaitingFirstSignature },
          { type: HardwareWalletSignatureEvent.TransactionFailed },
        ),
      ).toStrictEqual({
        status: HardwareWalletSignatureStatus.Failed,
        failedSignature: HardwareWalletSignatureStatus.AwaitingFirstSignature,
      });
    });

    it('ignores TransactionFailed when already Submitted', () => {
      expect(
        hardwareWalletSignaturesReducer(
          { status: HardwareWalletSignatureStatus.Submitted },
          { type: HardwareWalletSignatureEvent.TransactionFailed },
        ),
      ).toStrictEqual({
        status: HardwareWalletSignatureStatus.Submitted,
      });
    });

    it('ignores TransactionFailed when Rejected', () => {
      expect(
        hardwareWalletSignaturesReducer(
          {
            status: HardwareWalletSignatureStatus.Rejected,
            rejectedSignature:
              HardwareWalletSignatureStatus.AwaitingFirstSignature,
          },
          { type: HardwareWalletSignatureEvent.TransactionFailed },
        ),
      ).toStrictEqual({
        status: HardwareWalletSignatureStatus.Rejected,
        rejectedSignature: HardwareWalletSignatureStatus.AwaitingFirstSignature,
      });
    });
  });

  describe('DeviceDisconnected', () => {
    it('marks the active signature as disconnected', () => {
      expect(
        hardwareWalletSignaturesReducer(
          { status: HardwareWalletSignatureStatus.AwaitingFirstSignature },
          { type: HardwareWalletSignatureEvent.DeviceDisconnected },
        ),
      ).toStrictEqual({
        status: HardwareWalletSignatureStatus.Disconnected,
        disconnectedSignature:
          HardwareWalletSignatureStatus.AwaitingFirstSignature,
      });
    });

    it('marks the final signature as disconnected', () => {
      expect(
        hardwareWalletSignaturesReducer(
          { status: HardwareWalletSignatureStatus.AwaitingFinalSignature },
          { type: HardwareWalletSignatureEvent.DeviceDisconnected },
        ),
      ).toStrictEqual({
        status: HardwareWalletSignatureStatus.Disconnected,
        disconnectedSignature:
          HardwareWalletSignatureStatus.AwaitingFinalSignature,
      });
    });

    it('returns current disconnected state on DeviceDisconnected', () => {
      expect(
        hardwareWalletSignaturesReducer(
          {
            status: HardwareWalletSignatureStatus.Disconnected,
            disconnectedSignature:
              HardwareWalletSignatureStatus.AwaitingFirstSignature,
          },
          { type: HardwareWalletSignatureEvent.DeviceDisconnected },
        ),
      ).toStrictEqual({
        status: HardwareWalletSignatureStatus.Disconnected,
        disconnectedSignature:
          HardwareWalletSignatureStatus.AwaitingFirstSignature,
      });
    });

    it('ignores DeviceDisconnected when Submitted', () => {
      expect(
        hardwareWalletSignaturesReducer(
          { status: HardwareWalletSignatureStatus.Submitted },
          { type: HardwareWalletSignatureEvent.DeviceDisconnected },
        ),
      ).toStrictEqual({
        status: HardwareWalletSignatureStatus.Submitted,
      });
    });
  });

  describe('Retry', () => {
    it('retries from the rejected first signature', () => {
      expect(
        hardwareWalletSignaturesReducer(
          {
            status: HardwareWalletSignatureStatus.Rejected,
            rejectedSignature:
              HardwareWalletSignatureStatus.AwaitingFirstSignature,
          },
          { type: HardwareWalletSignatureEvent.Retry },
        ),
      ).toStrictEqual({
        status: HardwareWalletSignatureStatus.AwaitingFirstSignature,
      });
    });

    it('retries from the rejected final signature', () => {
      expect(
        hardwareWalletSignaturesReducer(
          {
            status: HardwareWalletSignatureStatus.Rejected,
            rejectedSignature:
              HardwareWalletSignatureStatus.AwaitingFinalSignature,
          },
          { type: HardwareWalletSignatureEvent.Retry },
        ),
      ).toStrictEqual({
        status: HardwareWalletSignatureStatus.AwaitingFinalSignature,
      });
    });

    it('retries from the failed signature', () => {
      expect(
        hardwareWalletSignaturesReducer(
          {
            status: HardwareWalletSignatureStatus.Failed,
            failedSignature:
              HardwareWalletSignatureStatus.AwaitingFirstSignature,
          },
          { type: HardwareWalletSignatureEvent.Retry },
        ),
      ).toStrictEqual({
        status: HardwareWalletSignatureStatus.AwaitingFirstSignature,
      });
    });

    it('retries from the disconnected signature', () => {
      expect(
        hardwareWalletSignaturesReducer(
          {
            status: HardwareWalletSignatureStatus.Disconnected,
            disconnectedSignature:
              HardwareWalletSignatureStatus.AwaitingFinalSignature,
          },
          { type: HardwareWalletSignatureEvent.Retry },
        ),
      ).toStrictEqual({
        status: HardwareWalletSignatureStatus.AwaitingFinalSignature,
      });
    });

    it('returns current state when retrying from Submitted', () => {
      expect(
        hardwareWalletSignaturesReducer(
          { status: HardwareWalletSignatureStatus.Submitted },
          { type: HardwareWalletSignatureEvent.Retry },
        ),
      ).toStrictEqual({
        status: HardwareWalletSignatureStatus.Submitted,
      });
    });

    it('returns current state when retrying from AwaitingFirstSignature', () => {
      expect(
        hardwareWalletSignaturesReducer(
          { status: HardwareWalletSignatureStatus.AwaitingFirstSignature },
          { type: HardwareWalletSignatureEvent.Retry },
        ),
      ).toStrictEqual({
        status: HardwareWalletSignatureStatus.AwaitingFirstSignature,
      });
    });
  });

  describe('Reset', () => {
    it('resets to the first signature when a new quote requires approval', () => {
      expect(
        hardwareWalletSignaturesReducer(
          { status: HardwareWalletSignatureStatus.Submitted },
          {
            type: HardwareWalletSignatureEvent.Reset,
            needsTwoConfirmations: true,
          },
        ),
      ).toStrictEqual({
        status: HardwareWalletSignatureStatus.AwaitingFirstSignature,
      });
    });

    it('resets to the final signature when a new quote does not require approval', () => {
      expect(
        hardwareWalletSignaturesReducer(
          { status: HardwareWalletSignatureStatus.Submitted },
          {
            type: HardwareWalletSignatureEvent.Reset,
            needsTwoConfirmations: false,
          },
        ),
      ).toStrictEqual({
        status: HardwareWalletSignatureStatus.AwaitingFinalSignature,
      });
    });

    it('resets from Rejected state', () => {
      expect(
        hardwareWalletSignaturesReducer(
          {
            status: HardwareWalletSignatureStatus.Rejected,
            rejectedSignature:
              HardwareWalletSignatureStatus.AwaitingFinalSignature,
          },
          {
            type: HardwareWalletSignatureEvent.Reset,
            needsTwoConfirmations: true,
          },
        ),
      ).toStrictEqual({
        status: HardwareWalletSignatureStatus.AwaitingFirstSignature,
      });
    });

    it('resets from Failed state', () => {
      expect(
        hardwareWalletSignaturesReducer(
          {
            status: HardwareWalletSignatureStatus.Failed,
            failedSignature:
              HardwareWalletSignatureStatus.AwaitingFirstSignature,
          },
          {
            type: HardwareWalletSignatureEvent.Reset,
            needsTwoConfirmations: false,
          },
        ),
      ).toStrictEqual({
        status: HardwareWalletSignatureStatus.AwaitingFinalSignature,
      });
    });
  });
});
