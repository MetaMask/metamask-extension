import { ErrorCode } from '@metamask/hw-wallet-sdk';
import { IconName } from '../../../component-library';
import { HardwareWalletType } from '../../../../contexts/hardware-wallets/types';
import { IconColor } from '../../../../helpers/constants/design-system';
import { buildErrorContent } from './error-content-builder';

// Mock the getHardwareWalletErrorCode function
jest.mock('../../../../contexts/hardware-wallets', () => ({
  getHardwareWalletErrorCode: jest.fn(),
}));

// Import the mock after jest.mock
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getHardwareWalletErrorCode } = require('../../../../contexts/hardware-wallets');

const mockT = (key: string, substitutions?: string[]) => {
  if (substitutions) {
    return `${key}[${substitutions.join(',')}]`;
  }
  return key;
};

describe('buildErrorContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns locked device content for AuthenticationDeviceLocked', () => {
    getHardwareWalletErrorCode.mockReturnValue(
      ErrorCode.AuthenticationDeviceLocked,
    );

    const result = buildErrorContent(
      new Error('locked'),
      HardwareWalletType.Ledger,
      mockT,
    );

    expect(result.variant).toBe('recovery');
    expect(result.title).toContain('hardwareWalletErrorTitleDeviceLocked');
    if (result.variant === 'recovery') {
      expect(result.recoveryInstructions).toHaveLength(3);
      expect(result.recoveryInstructions[0]).toBe(
        'hardwareWalletErrorRecoveryUnlock1',
      );
    }
    expect(result).toHaveProperty('icon', IconName.Lock);
    expect(result).toHaveProperty('iconColor', IconColor.iconDefault);
  });

  it('returns eth app closed content for DeviceStateEthAppClosed', () => {
    getHardwareWalletErrorCode.mockReturnValue(
      ErrorCode.DeviceStateEthAppClosed,
    );

    const result = buildErrorContent(
      new Error('eth app closed'),
      HardwareWalletType.Ledger,
      mockT,
    );

    expect(result.variant).toBe('recovery');
    expect(result.title).toContain(
      'hardwareWalletErrorTitleConnectYourDevice',
    );
    if (result.variant === 'recovery') {
      expect(result.recoveryInstructions).toHaveLength(1);
      expect(result.recoveryInstructions[0]).toBe(
        'hardwareWalletEthAppNotOpenDescription',
      );
    }
  });

  it('returns blind sign content for DeviceStateBlindSignNotSupported', () => {
    getHardwareWalletErrorCode.mockReturnValue(
      ErrorCode.DeviceStateBlindSignNotSupported,
    );

    const result = buildErrorContent(
      new Error('blind sign'),
      HardwareWalletType.Ledger,
      mockT,
    );

    expect(result.variant).toBe('recovery');
    if (result.variant === 'recovery') {
      expect(result.recoveryInstructions).toHaveLength(3);
    }
  });

  it('returns disconnected content for DeviceDisconnected', () => {
    getHardwareWalletErrorCode.mockReturnValue(ErrorCode.DeviceDisconnected);

    const result = buildErrorContent(
      new Error('disconnected'),
      HardwareWalletType.Ledger,
      mockT,
    );

    expect(result.variant).toBe('recovery');
    if (result.variant === 'recovery') {
      expect(result.recoveryInstructions).toHaveLength(3);
      expect(result.recoveryInstructions[0]).toBe(
        'hardwareWalletErrorRecoveryConnection1',
      );
    }
  });

  it('returns connection closed content for ConnectionClosed', () => {
    getHardwareWalletErrorCode.mockReturnValue(ErrorCode.ConnectionClosed);

    const result = buildErrorContent(
      new Error('closed'),
      HardwareWalletType.Ledger,
      mockT,
    );

    expect(result.variant).toBe('recovery');
    if (result.variant === 'recovery') {
      expect(result.recoveryInstructions).toHaveLength(3);
      expect(result.recoveryInstructions[0]).toBe(
        'hardwareWalletErrorRecoveryUnlock1',
      );
    }
  });

  it('returns unknown error content for unrecognized error codes', () => {
    getHardwareWalletErrorCode.mockReturnValue(null);

    const result = buildErrorContent(
      new Error('unknown'),
      HardwareWalletType.Ledger,
      mockT,
    );

    expect(result.variant).toBe('description');
    expect(result.title).toBe('hardwareWalletErrorUnknownErrorTitle');
    expect(result).toHaveProperty('icon', IconName.Danger);
    expect(result).toHaveProperty('iconColor', IconColor.warningDefault);
    if (result.variant === 'description') {
      expect(result.description).toContain(
        'hardwareWalletErrorUnknownErrorDescription',
      );
    }
  });

  it('includes wallet type in title substitutions', () => {
    getHardwareWalletErrorCode.mockReturnValue(
      ErrorCode.AuthenticationDeviceLocked,
    );

    const result = buildErrorContent(
      new Error('locked'),
      HardwareWalletType.Ledger,
      mockT,
    );

    // The mock t function formats substitutions as [sub1,sub2]
    expect(result.title).toContain(HardwareWalletType.Ledger);
  });
});
