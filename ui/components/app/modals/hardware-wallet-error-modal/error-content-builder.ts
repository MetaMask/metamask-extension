import { ErrorCode } from '@metamask/hw-wallet-sdk';
import { IconName, IconColor } from '@metamask/design-system-react';
import {
  getHardwareWalletErrorCode,
  HardwareWalletType,
} from '../../../../contexts/hardware-wallets';

/** Discriminant values for {@link ErrorContent}; use for comparisons and `buildErrorContent` returns. */
export const HardwareWalletErrorContentVariant = {
  Recovery: 'recovery',
  Description: 'description',
} as const;

/**
 * Error content structure
 */
type ErrorContentBase = {
  title: string;
};

type ErrorContentWithRecovery = ErrorContentBase & {
  variant: typeof HardwareWalletErrorContentVariant.Recovery;
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
  variant: typeof HardwareWalletErrorContentVariant.Description;
  description: string;
  icon: IconName;
  iconColor: IconColor;
};

export type ErrorContent =
  | ErrorContentWithIcon
  | ErrorContentWithoutIcon
  | ErrorContentWithDescription;

/**
 * Conditionally append a recovery instruction to the list.
 *
 * @param instructions - Existing recovery instruction strings
 * @param shouldAdd - Whether to append the new instruction
 * @param instruction - The instruction to append when `shouldAdd` is true
 * @returns A new array with the instruction appended, or the original array unchanged
 */
function addRecoveryInstruction(
  instructions: string[],
  shouldAdd: boolean,
  instruction: string,
): string[] {
  return shouldAdd ? [...instructions, instruction] : instructions;
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
  const errorCode = getHardwareWalletErrorCode(error);

  switch (errorCode) {
    // Locked device errors
    case ErrorCode.AuthenticationDeviceLocked:
      return {
        variant: HardwareWalletErrorContentVariant.Recovery,
        icon: IconName.Lock,
        iconColor: IconColor.IconDefault,
        title: t('hardwareWalletErrorTitleDeviceLocked', [t(walletType)]),
        recoveryInstructions: addRecoveryInstruction(
          [t('hardwareWalletErrorRecoveryUnlock1', [t(walletType)])],
          walletType === HardwareWalletType.Ledger,
          t('hardwareWalletErrorRecoveryUnlock2'),
        ),
      };

    // Device state - Wrong app
    case ErrorCode.DeviceStateEthAppClosed:
      return {
        variant: HardwareWalletErrorContentVariant.Recovery,
        title: t('hardwareWalletTitleEthAppNotOpen'),
        recoveryInstructions: [t('hardwareWalletEthAppNotOpenDescription')],
      };

    case ErrorCode.DeviceStateBlindSignNotSupported:
      return {
        variant: HardwareWalletErrorContentVariant.Recovery,
        title: t('hardwareWalletErrorTitleBlindSignNotSupported'),
        recoveryInstructions: [
          t('hardwareWalletErrorTitleBlindSignNotSupportedInstruction1'),
          t('hardwareWalletErrorTitleBlindSignNotSupportedInstruction2'),
        ],
      };

    // Device state - Disconnected/Connection issues
    case ErrorCode.DeviceDisconnected:
      return {
        variant: HardwareWalletErrorContentVariant.Recovery,
        title: t('hardwareWalletErrorTitleConnectYourDevice', [t(walletType)]),
        recoveryInstructions: addRecoveryInstruction(
          [
            t('hardwareWalletErrorRecoveryConnection1'),
            t('hardwareWalletErrorRecoveryConnection2'),
            t('hardwareWalletErrorRecoveryConnection3'),
          ],
          walletType === HardwareWalletType.Trezor,
          t('hardwareWalletErrorRecoveryConnection4', [t(walletType)]),
        ),
      };

    // Usually bolos will yield this result
    case ErrorCode.ConnectionClosed:
      return {
        variant: HardwareWalletErrorContentVariant.Recovery,
        title: t('hardwareWalletErrorTitleConnectYourDevice', [t(walletType)]),
        recoveryInstructions: addRecoveryInstruction(
          [t('hardwareWalletErrorRecoveryUnlock1', [t(walletType)])],
          walletType === HardwareWalletType.Ledger,
          t('hardwareWalletErrorRecoveryUnlock2'),
        ),
      };

    // Unknown/default
    default:
      return {
        variant: HardwareWalletErrorContentVariant.Description,
        icon: IconName.Danger,
        iconColor: IconColor.WarningDefault,
        title: t('hardwareWalletErrorUnknownErrorTitle'),
        description: t('hardwareWalletErrorUnknownErrorDescription', [
          t(walletType),
        ]),
      };
  }
}
