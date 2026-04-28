import {
  HardwareWalletSignatureEvent,
  HardwareWalletSignatureStatus,
  getInitialHardwareWalletSignaturesState,
  hardwareWalletSignaturesReducer,
} from './hardware-wallet-signatures-state-machine';

describe('hardwareWalletSignaturesReducer', () => {
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

  it('marks the transaction as submitted', () => {
    expect(
      hardwareWalletSignaturesReducer(
        { status: HardwareWalletSignatureStatus.AwaitingFinalSignature },
        { type: HardwareWalletSignatureEvent.TransactionSubmitted },
      ),
    ).toStrictEqual({
      status: HardwareWalletSignatureStatus.Submitted,
    });
  });

  it('marks the active signature as rejected', () => {
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

  it('retries from the rejected signature', () => {
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
          failedSignature: HardwareWalletSignatureStatus.AwaitingFirstSignature,
        },
        { type: HardwareWalletSignatureEvent.Retry },
      ),
    ).toStrictEqual({
      status: HardwareWalletSignatureStatus.AwaitingFirstSignature,
    });
  });

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
});
