import { HardwareWalletSignatureStatus } from '../../pages/hardware-wallets/swap/hardware-wallet-signatures-state-machine';

export type HwSwapStoryArgs = {
  status: HardwareWalletSignatureStatus;
  needsTwoConfirmations: boolean;
  hardwareWalletType: 'trezor' | 'ledger' | 'keystore';
  showInlineQrSigning: boolean;
  isReadingQrSignature: boolean;
};

export const hwSwapStoryState: { current: HwSwapStoryArgs } = {
  current: {
    status: HardwareWalletSignatureStatus.AwaitingFirstSignature,
    needsTwoConfirmations: true,
    hardwareWalletType: 'ledger',
    showInlineQrSigning: false,
    isReadingQrSignature: false,
  },
};
