import { IconName } from '@metamask/design-system-react';
import { HardwareWalletType } from '../../contexts/hardware-wallets/types';
import { createAdapterForHardwareWalletType } from '../../contexts/hardware-wallets/adapters/factory';
import {
  ensureRepairDeviceReady,
  getInstructionSteps,
} from './hardware-wallet-repair-utils';

jest.mock('../../contexts/hardware-wallets/adapters/factory', () => ({
  createAdapterForHardwareWalletType: jest.fn(),
}));

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

describe('ensureRepairDeviceReady', () => {
  const mockAdapter = {
    connect: jest.fn(),
    disconnect: jest.fn(),
    isConnected: jest.fn(),
    destroy: jest.fn(),
    ensureDeviceReady: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createAdapterForHardwareWalletType as jest.Mock).mockReturnValue(
      mockAdapter,
    );
  });

  it('creates an adapter for the route wallet type and verifies readiness', async () => {
    mockAdapter.connect.mockResolvedValue(undefined);
    mockAdapter.ensureDeviceReady.mockResolvedValue(true);

    await expect(
      ensureRepairDeviceReady(HardwareWalletType.Trezor),
    ).resolves.toBe(true);

    expect(createAdapterForHardwareWalletType).toHaveBeenCalledWith(
      HardwareWalletType.Trezor,
      expect.objectContaining({
        onDisconnect: expect.any(Function),
        onDeviceEvent: expect.any(Function),
      }),
    );
    expect(mockAdapter.connect).toHaveBeenCalled();
    expect(mockAdapter.ensureDeviceReady).toHaveBeenCalled();
    expect(mockAdapter.destroy).toHaveBeenCalled();
  });

  it('destroys the adapter when readiness verification throws', async () => {
    mockAdapter.connect.mockResolvedValue(undefined);
    mockAdapter.ensureDeviceReady.mockRejectedValue(new Error('not ready'));

    await expect(
      ensureRepairDeviceReady(HardwareWalletType.Ledger),
    ).rejects.toThrow('not ready');

    expect(mockAdapter.destroy).toHaveBeenCalled();
  });
});
