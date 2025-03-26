import React, { useState } from 'react';
import {
  Box,
  Text,
  Icon,
  IconName,
  IconSize,
  ModalContent,
  Modal,
  ModalFooter,
  ModalHeader,
  ModalBody,
  ModalOverlay,
} from '../../../components/component-library';
import ToggleButton from '../../../components/ui/toggle-button';
import Card from '../../../components/ui/card';
import { AccountPicker } from '../../../components/multichain/account-picker';
import { AccountListMenu } from '../../../components/multichain/account-list-menu';
import {
  FontWeight,
  TextVariant,
  Display,
  JustifyContent,
  TextColor,
  IconColor,
  BackgroundColor,
} from '../../../helpers/constants/design-system';

export default function RemoteModeSettings() {
  const [isEnabled, setIsEnabled] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSwapsEnabled, setIsSwapsEnabled] = useState(true);
  const [isLongTailSwapsEnabled, setIsLongTailSwapsEnabled] = useState(false);
  const [isDailySpendingAllowanceEnabled, setIsDailySpendingAllowanceEnabled] =
    useState(false);

  return (
    <>
      {isModalOpen && (
        <AccountListMenu
          onClose={() => {
            setIsModalOpen(false);
          }}
          showAccountCreation={false}
        />
      )}
      <Box
        display={Display.Flex}
        gap={2}
        justifyContent={JustifyContent.spaceBetween}
      >
        <Text>Remote mode</Text>
        <ToggleButton
          value={isEnabled}
          onToggle={() => {
            setIsEnabled(!isEnabled);
          }}
        />
      </Box>

      <Box paddingTop={2} paddingBottom={2}>
        <Text variant={TextVariant.bodyMd} color={TextColor.textMuted}>
          Safely access your hardware wallet funds without plugging it in.
        </Text>
      </Box>
      {isEnabled && (
        <>
          <Text>Account</Text>
          <Box paddingTop={2} paddingBottom={2}>
            <Card>
              <AccountPicker
                address="0x12C7e...q135f"
                name="Account #1"
                onClick={() => {
                  setIsModalOpen(true);
                }}
                // block={true}
              />
            </Card>
          </Box>
          <Card backgroundColor={BackgroundColor.backgroundMuted}>
            <Box
              display={Display.Flex}
              gap={2}
              paddingBottom={2}
              justifyContent={JustifyContent.spaceBetween}
            >
              <Text fontWeight={FontWeight.Bold}>Swaps</Text>
              <Box>
                <ToggleButton
                  value={isSwapsEnabled}
                  onToggle={() => {
                    setIsSwapsEnabled(!isSwapsEnabled);
                  }}
                />
              </Box>
            </Box>
            <Box paddingBottom={2}>
              <Text color={TextColor.textMuted}>
                Swap any amount between allow listed tokens.
              </Text>
            </Box>
            {isSwapsEnabled && (
              <>
            <Box paddingTop={2} paddingBottom={2}>
              <Text>Tokens</Text>
            </Box>
            <Box>
              <Text
                style={{
                  borderRadius: '16px',
                  padding: '4px 12px 4px 8px',
                  marginRight: '4px',
                  backgroundColor: 'rgba(67, 174, 252, 0.15)',
                  display: 'inline-block',
                }}
              >
                <Icon
                  name={IconName.Ethereum}
                  size={IconSize.Sm}
                  color={IconColor.primaryDefault}
                />{' '}
                ETH
              </Text>
              <Text
                style={{
                  borderRadius: '16px',
                  padding: '4px 12px 4px 8px',
                  marginRight: '4px',
                  backgroundColor: 'rgba(67, 174, 252, 0.15)',
                  display: 'inline-block',
                }}
              >
                <Icon
                  name={IconName.Ethereum}
                  size={IconSize.Sm}
                  color={IconColor.primaryDefault}
                />{' '}
                WETH
              </Text>
              </Box>
            </>)}
          </Card>
          <Card
            backgroundColor={BackgroundColor.backgroundMuted}
            style={{
              marginTop: '10px',
            }}
          >
            <Box
              display={Display.Flex}
              gap={2}
              paddingTop={2}
              paddingBottom={2}
              justifyContent={JustifyContent.spaceBetween}
            >
              <Text fontWeight={FontWeight.Bold}>Swaps</Text>
              <Box>
                <ToggleButton
                  value={isLongTailSwapsEnabled}
                  onToggle={() => {
                    setIsLongTailSwapsEnabled(!isLongTailSwapsEnabled);
                  }}
                />
              </Box>
            </Box>
            <Box paddingBottom={2}>
              <Text color={TextColor.textMuted}>
                Grant a small token specific allowance to trade daily.
              </Text>
            </Box>
          </Card>
          <Card
            backgroundColor={BackgroundColor.backgroundMuted}
            style={{
              marginTop: '10px',
            }}
          >
            <Box
              display={Display.Flex}
              gap={2}
              paddingTop={2}
              paddingBottom={2}
              justifyContent={JustifyContent.spaceBetween}
            >
              <Text fontWeight={FontWeight.Bold}>Spending Allowance</Text>
              <Box>
                <ToggleButton
                  value={isLongTailSwapsEnabled}
                  onToggle={() => {
                    setIsDailySpendingAllowanceEnabled(
                      !isDailySpendingAllowanceEnabled,
                    );
                  }}
                />
              </Box>
            </Box>
            <Box paddingBottom={2}>
              <Text color={TextColor.textMuted}>
                Spend up to a set limit within 24 hours. Unused funds do not
                roll over.
              </Text>
            </Box>
          </Card>
        </>
      )}
    </>
  );
}
