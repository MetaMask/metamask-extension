import { HardwareWalletSignatureStatus } from './hardware-wallet-signatures-state-machine';
import type { HardwareWalletSignaturesState } from './hardware-wallet-signatures-state-machine';

export const createSignatureState = (
  status: HardwareWalletSignatureStatus,
): HardwareWalletSignaturesState => {
  switch (status) {
    case HardwareWalletSignatureStatus.Rejected:
      return {
        status,
        rejectedSignature: HardwareWalletSignatureStatus.AwaitingFirstSignature,
      };
    case HardwareWalletSignatureStatus.Failed:
      return {
        status,
        failedSignature: HardwareWalletSignatureStatus.AwaitingFirstSignature,
      };
    case HardwareWalletSignatureStatus.Disconnected:
      return {
        status,
        disconnectedSignature:
          HardwareWalletSignatureStatus.AwaitingFirstSignature,
      };
    default:
      return { status };
  }
};
