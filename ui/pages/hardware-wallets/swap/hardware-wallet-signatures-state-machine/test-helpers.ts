import { HardwareWalletSignatureStatus } from '.';
import type { HardwareWalletSignaturesState, SigningStatus } from '.';

export const createSignatureState = (
  status: HardwareWalletSignatureStatus,
  savedStep?: SigningStatus,
): HardwareWalletSignaturesState => {
  switch (status) {
    case HardwareWalletSignatureStatus.Rejected:
      return {
        status,
        rejectedSignature:
          savedStep ?? HardwareWalletSignatureStatus.AwaitingFirstSignature,
      };
    case HardwareWalletSignatureStatus.Failed:
      return {
        status,
        failedSignature:
          savedStep ?? HardwareWalletSignatureStatus.AwaitingFirstSignature,
      };
    case HardwareWalletSignatureStatus.Disconnected:
      return {
        status,
        disconnectedSignature:
          savedStep ?? HardwareWalletSignatureStatus.AwaitingFirstSignature,
      };
    default:
      return { status };
  }
};
