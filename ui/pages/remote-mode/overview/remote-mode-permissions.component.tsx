import React, { useState } from 'react';

import {
  Box,
  Text,
  Icon,
  IconName,
  IconSize,
} from '../../../components/component-library';
import Card from '../../../components/ui/card';
import {
  AlignItems,
  TextVariant,
  Display,
  JustifyContent,
  TextColor,
  BackgroundColor,
  FlexDirection,
} from '../../../helpers/constants/design-system';

import {
  RemoteModeSwapAllowanceCard,
  RemoteModeDailyAllowanceCard,
  RevokeWithdrawlConfirm,
} from '../components';

import { DailyAllowance, SwapAllowance } from '../remote.types';
import { RevokeWithdrawlConfirmModalType } from '../components/revoke-withdrawl-confirm-modal';

type RemoteModeConfig = {
  swapAllowance: {
    allowances: SwapAllowance[];
  };
  dailyAllowance: {
    allowances: DailyAllowance[];
  };
};

export default function RemoteModePermissions({
  remoteModeConfig,
  setStartEnableRemoteSwap,
  setStartEnableDailyAllowance,
}: {
  remoteModeConfig: RemoteModeConfig | null;
  setStartEnableRemoteSwap?: (startEnableRemoteSwap: boolean) => void;
  setStartEnableDailyAllowance?: (startEnableDailyAllowance: boolean) => void;
}) {
  const [isAllowancesExpanded, setIsAllowancesExpanded] = useState(false);
  const [isDailyAllowanceExpanded, setIsDailyAllowanceExpanded] =
    useState(false);
  const [isRevokeWithdrawlConfirmVisible, setIsRevokeWithdrawlConfirmVisible] =
    useState(false);
  const [isRevokeSpendAllowanceVisible, setIsRevokeSpendAllowanceVisible] =
    useState(false);

  const swapAllowance = remoteModeConfig?.swapAllowance || null;
  const dailyAllowance = remoteModeConfig?.dailyAllowance || null;

  const handleEnableRemoteSwap = () => {
    if (setStartEnableRemoteSwap) {
      setStartEnableRemoteSwap(true);
    }
  };

  const handleEnableDailyAllowance = () => {
    if (setStartEnableDailyAllowance) {
      setStartEnableDailyAllowance(true);
    }
  };

  const handleRevokeRemoteSwap = () => {
    // todo: handoff to the confirmation screen (when available)
    const remoteModeData = JSON.parse(
      localStorage.getItem('remoteMode') || 'null',
    );
    if (remoteModeData) {
      const { swapAllowance: _, ...updatedRemoteMode } = remoteModeData;
      localStorage.setItem('remoteMode', JSON.stringify(updatedRemoteMode));
    }
    setIsRevokeWithdrawlConfirmVisible(false);
  };

  const handleRevokeDailyAllowance = () => {
    // todo: handoff to the confirmation screen (when available)
    const remoteModeData = JSON.parse(
      localStorage.getItem('remoteMode') || 'null',
    );
    if (remoteModeData) {
      const { dailyAllowance: _, ...updatedRemoteMode } = remoteModeData;
      localStorage.setItem('remoteMode', JSON.stringify(updatedRemoteMode));
    }
    setIsRevokeSpendAllowanceVisible(false);
  };

  return (
    <Box>
      <Text variant={TextVariant.bodyMd} color={TextColor.textAlternativeSoft}>
        Safely access your hardware wallet funds without plugging it in. Revoke
        permissions anytime.
      </Text>
      <Box paddingTop={2} paddingBottom={2}>
        <Card backgroundColor={BackgroundColor.backgroundMuted}>
          <Box
            display={Display.Flex}
            gap={2}
            justifyContent={JustifyContent.spaceBetween}
            paddingTop={2}
            paddingBottom={2}
          >
            <Text>Remote Swaps</Text>
            {swapAllowance ? (
              <Box display={Display.Flex} gap={6}>
                <Text
                  color={TextColor.infoDefault}
                  style={{ cursor: 'pointer' }}
                >
                  Update
                </Text>
                <Text
                  color={TextColor.errorDefault}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setIsRevokeWithdrawlConfirmVisible(true)}
                >
                  Revoke
                </Text>
              </Box>
            ) : (
              <Text
                color={TextColor.infoDefault}
                style={{ cursor: 'pointer' }}
                onClick={handleEnableRemoteSwap}
              >
                Turn on
              </Text>
            )}
          </Box>
          {swapAllowance ? (
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Column}
              gap={4}
              paddingTop={4}
              paddingBottom={4}
            >
              <Box
                display={Display.Flex}
                justifyContent={JustifyContent.spaceBetween}
                gap={2}
              >
                <Text variant={TextVariant.bodyMd} color={TextColor.textMuted}>
                  Authorized
                </Text>
                <Text variant={TextVariant.bodyMd} color={TextColor.textMuted}>
                  Account #1
                </Text>
              </Box>
              <Box
                display={Display.Flex}
                justifyContent={JustifyContent.spaceBetween}
                gap={2}
              >
                <Text variant={TextVariant.bodyMd} color={TextColor.textMuted}>
                  Networks
                </Text>
                <Text variant={TextVariant.bodyMd} color={TextColor.textMuted}>
                  Ethereum Mainnet
                </Text>
              </Box>
              <Box
                display={Display.Flex}
                justifyContent={JustifyContent.spaceBetween}
                gap={2}
              >
                <Text variant={TextVariant.bodyMd} color={TextColor.textMuted}>
                  Available on
                </Text>
                <Text variant={TextVariant.bodyMd} color={TextColor.textMuted}>
                  MetaMask Swaps
                </Text>
              </Box>

              <Box
                display={Display.Flex}
                justifyContent={JustifyContent.spaceBetween}
                alignItems={AlignItems.center}
                onClick={() => setIsAllowancesExpanded(!isAllowancesExpanded)}
                style={{ cursor: 'pointer' }}
              >
                <Text color={TextColor.infoDefault}>
                  {swapAllowance.allowances.length} token
                  {swapAllowance.allowances.length === 1 ? '' : 's'} enabled
                </Text>
                <Text color={TextColor.infoDefault}>
                  {isAllowancesExpanded ? (
                    <Icon name={IconName.ArrowUp} size={IconSize.Sm} />
                  ) : (
                    <Icon name={IconName.ArrowDown} size={IconSize.Sm} />
                  )}
                </Text>
              </Box>
              {isAllowancesExpanded && (
                <Box>
                  {swapAllowance.allowances.map((allowance) => (
                    <RemoteModeSwapAllowanceCard
                      key={allowance.from}
                      swapAllowance={allowance}
                    />
                  ))}
                </Box>
              )}
            </Box>
          ) : (
            <Text color={TextColor.textAlternativeSoft}>
              Allow your MetaMask account to trade with hardware funds via
              MetaMask Swaps. Allowances can only be used to swap.
            </Text>
          )}
        </Card>
      </Box>
      <Box paddingTop={2} paddingBottom={2}>
        <Card backgroundColor={BackgroundColor.backgroundMuted}>
          <Box
            display={Display.Flex}
            gap={2}
            justifyContent={JustifyContent.spaceBetween}
            paddingTop={2}
            paddingBottom={2}
          >
            <Text>Withdrawal limit</Text>
            {dailyAllowance ? (
              <Box display={Display.Flex} gap={6}>
                <Text
                  color={TextColor.infoDefault}
                  style={{ cursor: 'pointer' }}
                >
                  Update
                </Text>
                <Text
                  color={TextColor.errorDefault}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setIsRevokeSpendAllowanceVisible(true)}
                >
                  Revoke
                </Text>
              </Box>
            ) : (
              <Text
                color={TextColor.infoDefault}
                style={{ cursor: 'pointer' }}
                onClick={handleEnableDailyAllowance}
              >
                Turn on
              </Text>
            )}
          </Box>
          {dailyAllowance ? (
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Column}
              gap={4}
              paddingTop={4}
              paddingBottom={4}
            >
              <Box
                display={Display.Flex}
                justifyContent={JustifyContent.spaceBetween}
                gap={2}
              >
                <Text variant={TextVariant.bodyMd} color={TextColor.textMuted}>
                  Authorized
                </Text>
                <Text variant={TextVariant.bodyMd} color={TextColor.textMuted}>
                  Account #1
                </Text>
              </Box>
              <Box
                display={Display.Flex}
                justifyContent={JustifyContent.spaceBetween}
                gap={2}
              >
                <Text variant={TextVariant.bodyMd} color={TextColor.textMuted}>
                  Networks
                </Text>
                <Text variant={TextVariant.bodyMd} color={TextColor.textMuted}>
                  Ethereum Mainnet
                </Text>
              </Box>
              <Box
                display={Display.Flex}
                justifyContent={JustifyContent.spaceBetween}
                gap={2}
              >
                <Text variant={TextVariant.bodyMd} color={TextColor.textMuted}>
                  Available on
                </Text>
                <Text variant={TextVariant.bodyMd} color={TextColor.textMuted}>
                  MetaMask Swaps
                </Text>
              </Box>

              <Box
                display={Display.Flex}
                justifyContent={JustifyContent.spaceBetween}
                alignItems={AlignItems.center}
                onClick={() =>
                  setIsDailyAllowanceExpanded(!isDailyAllowanceExpanded)
                }
                style={{ cursor: 'pointer' }}
              >
                <Text color={TextColor.infoDefault}>
                  {dailyAllowance.allowances.length} token
                  {dailyAllowance.allowances.length === 1 ? '' : 's'} enabled
                </Text>
                <Text color={TextColor.infoDefault}>
                  {isDailyAllowanceExpanded ? (
                    <Icon name={IconName.ArrowUp} size={IconSize.Sm} />
                  ) : (
                    <Icon name={IconName.ArrowDown} size={IconSize.Sm} />
                  )}
                </Text>
              </Box>
              {isDailyAllowanceExpanded && (
                <Box>
                  {dailyAllowance.allowances.map((allowance) => (
                    <RemoteModeDailyAllowanceCard
                      key={allowance.tokenType}
                      dailyAllowance={allowance}
                    />
                  ))}
                </Box>
              )}
            </Box>
          ) : (
            <Text color={TextColor.textAlternativeSoft}>
              Allow your MetaMask account to withdraw from hardware funds up to
              the daily limit.
            </Text>
          )}
        </Card>
        <RevokeWithdrawlConfirm
          visible={isRevokeWithdrawlConfirmVisible}
          onConfirm={handleRevokeRemoteSwap}
          onClose={() => setIsRevokeWithdrawlConfirmVisible(false)}
          type={RevokeWithdrawlConfirmModalType.Swap}
        />
        <RevokeWithdrawlConfirm
          visible={isRevokeSpendAllowanceVisible}
          onConfirm={handleRevokeDailyAllowance}
          onClose={() => setIsRevokeSpendAllowanceVisible(false)}
          type={RevokeWithdrawlConfirmModalType.Spend}
        />
      </Box>
    </Box>
  );
}
