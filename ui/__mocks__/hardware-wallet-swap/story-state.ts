import { HardwareWalletSignatureStatus } from '../../pages/hardware-wallets/swap/hardware-wallet-signatures-state-machine';
import { HardwareKeyringType } from '../../../shared/constants/hardware-wallets';

export type HwSwapStoryArgs = {
  status: HardwareWalletSignatureStatus;
  needsTwoConfirmations: boolean;
  hardwareWalletType: HardwareKeyringType;
  showInlineQrSigning: boolean;
  isReadingQrSignature: boolean;
};

export const hwSwapStoryState: { current: HwSwapStoryArgs } = {
  current: {
    status: HardwareWalletSignatureStatus.AwaitingFirstSignature,
    needsTwoConfirmations: true,
    hardwareWalletType: HardwareKeyringType.ledger,
    showInlineQrSigning: false,
    isReadingQrSignature: false,
  },
};
