import { IconName } from '@metamask/design-system-react';
import { HardwareWalletType } from '../../contexts/hardware-wallets/types';
import { getInstructionSteps } from './hardware-wallet-repair-utils';

describe('getInstructionSteps', () => {
  it('returns the Ledger-specific Ethereum app instruction for Ledger', () => {
    expect(getInstructionSteps(HardwareWalletType.Ledger)).toStrictEqual([
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
      {
        icon: IconName.Apps,
        titleKey: 'hardwareWalletTitleEthAppNotOpen',
        descriptionKey: 'hardwareWalletEthAppNotOpenDescription',
      },
    ]);
  });

  const commonInstructionWalletTypes: (HardwareWalletType | null)[] = [
    HardwareWalletType.Trezor,
    HardwareWalletType.OneKey,
    HardwareWalletType.Lattice,
    HardwareWalletType.Qr,
    HardwareWalletType.Unknown,
    null,
  ];

  for (const walletType of commonInstructionWalletTypes) {
    it(`returns common instructions for ${String(walletType)}`, () => {
      expect(getInstructionSteps(walletType)).toStrictEqual([
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
      ]);
    });
  }
});
