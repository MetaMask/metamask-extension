import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { Box, Icon, IconSize, Text } from '../../../component-library';
import {
  AlignItems,
  BlockSize,
  Display,
  FlexDirection,
  IconColor,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { ErrorCode } from '@metamask/hw-wallet-sdk';
import { createHardwareWalletError } from '../../../../contexts/hardware-wallets/errors';
import { HardwareWalletType } from '../../../../contexts/hardware-wallets/types';
import { buildErrorContent } from './error-content-builder';

interface HardwareWalletErrorContentProps {
  error: ReturnType<typeof createHardwareWalletError>;
  walletType: HardwareWalletType;
}

const HardwareWalletErrorContent = ({
  error,
  walletType,
}: HardwareWalletErrorContentProps) => {
  const t = useI18nContext();
  const { icon, title, description, recoveryInstructions } = buildErrorContent(
    error,
    walletType,
    t as (key: string, substitutions?: string[]) => string,
  );

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      alignItems={AlignItems.center}
      gap={4}
    >
      <Icon name={icon} color={IconColor.errorDefault} size={IconSize.Xl} />
      <Text
        variant={TextVariant.bodyMdMedium}
        textAlign={TextAlign.Center}
        color={TextColor.textAlternative}
      >
        {title}
      </Text>
      {description ? (
        <Text
          variant={TextVariant.bodyMd}
          textAlign={TextAlign.Center}
          color={TextColor.textAlternative}
        >
          {description}
        </Text>
      ) : null}
      {recoveryInstructions.length > 0 ? (
        <Box
          width={BlockSize.Full}
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          gap={2}
        >
          <Text
            variant={TextVariant.bodyMdMedium}
            color={TextColor.textDefault}
          >
            {t('hardwareWalletErrorRecoveryTitle')}
          </Text>
          {recoveryInstructions.map((instruction, index) => (
            <Box
              key={instruction}
              display={Display.Flex}
              flexDirection={FlexDirection.Row}
              gap={2}
              alignItems={AlignItems.flexStart}
            >
              <Text variant={TextVariant.bodyMd} color={TextColor.textDefault}>
                {`${index + 1}.`}
              </Text>
              <Text variant={TextVariant.bodyMd} color={TextColor.textDefault}>
                {instruction}
              </Text>
            </Box>
          ))}
        </Box>
      ) : null}
    </Box>
  );
};

const meta: Meta<typeof HardwareWalletErrorContent> = {
  title: 'Components/App/Modals/HardwareWalletErrorModal',
  component: HardwareWalletErrorContent,
};

export default meta;
type Story = StoryObj<typeof HardwareWalletErrorContent>;

const DEFAULT_WALLET_TYPE = HardwareWalletType.Ledger;

const createTestError = (
  code: ErrorCode,
  walletType: HardwareWalletType = DEFAULT_WALLET_TYPE,
) => createHardwareWalletError(code, walletType);

export const DeviceLocked: Story = {
  args: {
    error: createTestError(ErrorCode.AuthenticationDeviceLocked),
    walletType: DEFAULT_WALLET_TYPE,
  },
};

export const EthAppNotOpen: Story = {
  args: {
    error: createTestError(ErrorCode.DeviceStateEthAppClosed),
    walletType: DEFAULT_WALLET_TYPE,
  },
};

export const BlindSignNotSupported: Story = {
  args: {
    error: createTestError(ErrorCode.DeviceStateBlindSignNotSupported),
    walletType: DEFAULT_WALLET_TYPE,
  },
};

export const OnlyV4Supported: Story = {
  args: {
    error: createTestError(ErrorCode.DeviceStateOnlyV4Supported),
    walletType: DEFAULT_WALLET_TYPE,
  },
};

export const EthAppOutOfDate: Story = {
  args: {
    error: createTestError(ErrorCode.DeviceStateEthAppOutOfDate),
    walletType: DEFAULT_WALLET_TYPE,
  },
};

export const DeviceDisconnected: Story = {
  args: {
    error: createTestError(ErrorCode.DeviceDisconnected),
    walletType: DEFAULT_WALLET_TYPE,
  },
};

export const WebHidTransportMissing: Story = {
  args: {
    error: createTestError(ErrorCode.ConnectionTransportMissing),
    walletType: DEFAULT_WALLET_TYPE,
  },
};

export const ConnectionClosed: Story = {
  args: {
    error: createTestError(ErrorCode.ConnectionClosed),
    walletType: DEFAULT_WALLET_TYPE,
  },
};

export const ConnectionTimeout: Story = {
  args: {
    error: createTestError(ErrorCode.ConnectionTimeout),
    walletType: DEFAULT_WALLET_TYPE,
  },
};

export const UserCancelled: Story = {
  args: {
    error: createTestError(ErrorCode.UserCancelled),
    walletType: DEFAULT_WALLET_TYPE,
  },
};

export const UnknownError: Story = {
  args: {
    error: createTestError(ErrorCode.Unknown),
    walletType: DEFAULT_WALLET_TYPE,
  },
};
