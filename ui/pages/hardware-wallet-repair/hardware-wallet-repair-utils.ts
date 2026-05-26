import { IconName } from '@metamask/design-system-react';
import { HardwareWalletType } from '../../contexts/hardware-wallets/types';

export type InstructionStep = {
  icon: IconName;
  titleKey: string;
  descriptionKey: string;
};

export const COMMON_INSTRUCTIONS: InstructionStep[] = [
  {
    icon: IconName.Usb,
    titleKey: 'hardwareWalletRepairStepOneTitle',
    descriptionKey: 'hardwareWalletRepairStepOneDescription',
  },
  {
    icon: IconName.Lock,
    titleKey: 'hardwareWalletRepairStepTwoTitle',
    descriptionKey: 'hardwareWalletRepairStepTwoDescription',
  },
];

export const LEDGER_INSTRUCTIONS: InstructionStep[] = [
  ...COMMON_INSTRUCTIONS,
  {
    icon: IconName.Apps,
    titleKey: 'hardwareWalletTitleEthAppNotOpen',
    descriptionKey: 'hardwareWalletEthAppNotOpenDescription',
  },
];

/**
 * Returns repair instructions for the selected hardware wallet type.
 *
 * @param walletType - The selected hardware wallet type, or null if it is unknown.
 * @returns Ledger-specific instructions for Ledger; common connection instructions otherwise.
 */
export function getInstructionSteps(
  walletType: HardwareWalletType | null,
): InstructionStep[] {
  switch (walletType) {
    case HardwareWalletType.Ledger:
      return LEDGER_INSTRUCTIONS;
    case HardwareWalletType.Trezor:
    case HardwareWalletType.OneKey:
    case HardwareWalletType.Lattice:
    case HardwareWalletType.Qr:
    case HardwareWalletType.Unknown:
    default:
      return COMMON_INSTRUCTIONS;
  }
}
