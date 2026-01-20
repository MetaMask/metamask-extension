import { createAdapterForHardwareWalletType } from './factory';
import { LedgerAdapter } from './LedgerAdapter';
import { NonHardwareAdapter } from './NonHardwareAdapter';
import { TrezorAdapter } from './TrezorAdapter';
import { HardwareWalletType, type HardwareWalletAdapterOptions } from '../types';

describe('createAdapterForHardwareWalletType', () => {
  const mockOptions: HardwareWalletAdapterOptions = {
    onDisconnect: jest.fn(),
    onAwaitingConfirmation: jest.fn(),
    onDeviceLocked: jest.fn(),
    onAppNotOpen: jest.fn(),
    onDeviceEvent: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hardware wallet types', () => {
    it('creates LedgerAdapter for Ledger wallet type', () => {
      const adapter = createAdapterForHardwareWalletType(
        HardwareWalletType.Ledger,
        mockOptions,
      );
      expect(adapter).toBeInstanceOf(LedgerAdapter);
    });

    it('creates TrezorAdapter for Trezor wallet type', () => {
      const adapter = createAdapterForHardwareWalletType(
        HardwareWalletType.Trezor,
        mockOptions,
      );
      expect(adapter).toBeInstanceOf(TrezorAdapter);
    });

    it('throws error for unsupported hardware wallet types', () => {
      expect(() =>
        createAdapterForHardwareWalletType(
          HardwareWalletType.Lattice,
          mockOptions,
        ),
      ).toThrow('Unsupported hardware wallet type: lattice');
    });
  });

  describe('non-hardware wallet accounts', () => {
    it('creates NonHardwareAdapter when walletType is null', () => {
      const adapter = createAdapterForHardwareWalletType(null, mockOptions);
      expect(adapter).toBeInstanceOf(NonHardwareAdapter);
    });

    it('creates NonHardwareAdapter when walletType is undefined', () => {
      const adapter = createAdapterForHardwareWalletType(undefined, mockOptions);
      expect(adapter).toBeInstanceOf(NonHardwareAdapter);
    });

    it('NonHardwareAdapter is always connected', () => {
      const adapter = createAdapterForHardwareWalletType(null, mockOptions);
      expect(adapter.isConnected()).toBe(true);
    });

    it('NonHardwareAdapter ensureDeviceReady returns true', async () => {
      const adapter = createAdapterForHardwareWalletType(null, mockOptions);
      await expect(adapter.ensureDeviceReady?.('test-id')).resolves.toBe(true);
    });
  });
});

