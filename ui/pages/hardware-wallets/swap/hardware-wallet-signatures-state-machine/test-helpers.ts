import { HardwareWalletSignatureStatus } from '.';
import type { HardwareWalletSignaturesState } from '.';

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
