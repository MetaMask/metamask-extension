import { ErrorCode } from '@metamask/hw-wallet-sdk';
import { IconName } from '../../../component-library';
import { HardwareWalletType } from '../../../../contexts/hardware-wallets/types';
import { IconColor } from '../../../../helpers/constants/design-system';

/**
 * Error content structure
 */
type ErrorContentBase = {
  title: string;
};

type ErrorContentWithRecovery = ErrorContentBase & {
  variant: 'recovery';
  recoveryInstructions: string[];
};

type ErrorContentWithIcon = ErrorContentWithRecovery & {
  icon: IconName;
  iconColor: IconColor;
};

type ErrorContentWithoutIcon = ErrorContentWithRecovery & {
  icon?: undefined;
  iconColor?: undefined;
};

type ErrorContentWithDescription = ErrorContentBase & {
  variant: 'description';
  description: string;
  icon: IconName;
  iconColor: IconColor;
};

export type ErrorContent =
  | ErrorContentWithIcon
  | ErrorContentWithoutIcon
  | ErrorContentWithDescription;

/**
 * Extract error code from a hardware wallet error.
 * Handles both direct error.code and RPC error format (error.data.code).
 *
 * @param error - The error object
 * @returns The error code or undefined
 */
function getErrorCode(error: unknown): ErrorCode | undefined {
  // Direct code property (HardwareWalletError instances and duck-typed errors)
  const directCode = (error as { code?: number })?.code;
  if (typeof directCode === 'number') {
    return directCode as ErrorCode;
  }

  // RPC error format (from rpcErrors.internal())
  const rpcCode = (error as { data?: { code?: number } })?.data?.code;
  if (typeof rpcCode === 'number') {
    return rpcCode as ErrorCode;
  }

  return undefined;
}

/**
 * Build error content based on error code
 *
 * @param error - The hardware wallet error object
 * @param walletType - The type of hardware wallet
 * @param t - The translation function
 * @returns The formatted error content with icon, title, description, and recovery instructions
 */
export function buildErrorContent(
  error: unknown,
  walletType: HardwareWalletType,
  t: (key: string, substitutions?: string[]) => string,
): ErrorContent {
  const errorCode = getErrorCode(error);

  switch (errorCode) {
    // Locked device errors
    case ErrorCode.AuthenticationDeviceLocked:
      return {
        variant: 'recovery',
        icon: IconName.Lock,
        iconColor: IconColor.iconDefault,
        title: t('hardwareWalletErrorTitleDeviceLocked', [t(walletType)]),
        recoveryInstructions: [
          t('hardwareWalletErrorRecoveryUnlock1'),
          t('hardwareWalletErrorRecoveryUnlock2'),
          t('hardwareWalletErrorRecoveryUnlock3'),
        ],
      };

    // Device state - Wrong app
    case ErrorCode.DeviceStateEthAppClosed:
      return {
        variant: 'recovery',
        title: t('hardwareWalletErrorTitleConnectYourDevice', [t(walletType)]),
        recoveryInstructions: [t('hardwareWalletEthAppNotOpenDescription')],
      };

    case ErrorCode.DeviceStateBlindSignNotSupported:
      return {
        variant: 'recovery',
        title: t('hardwareWalletErrorTitleConnectYourDevice', [t(walletType)]),
        recoveryInstructions: [
          t('hardwareWalletErrorTitleBlindSignNotSupportedInstruction1'),
          t('hardwareWalletErrorTitleBlindSignNotSupportedInstruction2'),
          t('hardwareWalletErrorTitleBlindSignNotSupportedInstruction3'),
        ],
      };

    // Device state - Disconnected/Connection issues
    case ErrorCode.DeviceDisconnected:
      return {
        variant: 'recovery',
        title: t('hardwareWalletErrorTitleConnectYourDevice', [t(walletType)]),
        recoveryInstructions: [
          t('hardwareWalletErrorRecoveryConnection1'),
          t('hardwareWalletErrorRecoveryConnection2'),
          t('hardwareWalletErrorRecoveryConnection3'),
        ],
      };

    // Unknown/default
    default:
      return {
        variant: 'description',
        icon: IconName.Danger,
        iconColor: IconColor.warningDefault,
        title: t('hardwareWalletErrorUnknownErrorTitle'),
        description: t('hardwareWalletErrorUnknownErrorDescription', [
          t(walletType),
        ]),
      };
  }
}
