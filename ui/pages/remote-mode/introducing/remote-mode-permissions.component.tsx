import React from 'react';
import {
  Box,
  Text,
  Icon,
  IconName,
  Button,
} from '../../../components/component-library';
import Card from '../../../components/ui/card';
import {
  FontWeight,
  TextVariant,
  Display,
  JustifyContent,
  TextColor,
  IconColor,
  BackgroundColor,
} from '../../../helpers/constants/design-system';

export default function RemoteModePermissions({ setStartEnableRemoteSwap }: { setStartEnableRemoteSwap?: (startEnableRemoteSwap: boolean) => void }) {

  const handleEnableRemoteSwap = () => {
    if (setStartEnableRemoteSwap) {
      setStartEnableRemoteSwap(true);
    }
  }

  return (
    <>
      <Text variant={TextVariant.headingSm} fontWeight={FontWeight.Bold}>
        Permissions
      </Text>
      <Text variant={TextVariant.bodyMd} color={TextColor.textAlternativeSoft}>
        Safely access your hardware wallet funds without plugging it in.
      </Text>
      <Box
          paddingTop={2}
          paddingBottom={2}
        >
      <Card backgroundColor={BackgroundColor.backgroundMuted}>
        <Box
          display={Display.Flex}
          gap={2}
          justifyContent={JustifyContent.spaceBetween}
          paddingTop={2}
          paddingBottom={2}
        >
          <Text>
            Swap
          </Text>
          <Text color={TextColor.infoDefault} onClick={handleEnableRemoteSwap}>
            Enable
          </Text>
        </Box>
        <Text color={TextColor.textAlternativeSoft}>
          Allow your MetaMask account to trade with hardware funds. Allowances can only be used to swap. Revoke anytime.
        </Text>
        </Card>
      </Box>
      <Box
        paddingTop={2}
        paddingBottom={2}
      >
        <Card backgroundColor={BackgroundColor.backgroundMuted}>
          <Box
            display={Display.Flex}
          gap={2}
          justifyContent={JustifyContent.spaceBetween}
          paddingTop={2}
          paddingBottom={2}
        >
          <Text>
            Daily Allowances
          </Text>
          <Text color={TextColor.infoDefault}>
            Enable
          </Text>
        </Box>
        <Text color={TextColor.textAlternativeSoft}>
          Allow your MetaMask account to trade with hardware funds. Allowances can only be used to swap. Revoke anytime.
        </Text>
      </Card>
      </Box>
    </>
  );
}
