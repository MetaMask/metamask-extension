import React from 'react';
import {
  AvatarIcon,
  AvatarIconSize,
  Box,
  Text,
  Icon,
  IconName,
} from '../../../components/component-library';
import {
  BackgroundColor,
  FontWeight,
  TextVariant,
  Display,
  JustifyContent,
  TextColor,
  IconColor,
} from '../../../helpers/constants/design-system';

export default function RemoteModeIntroducing() {
  return (
    <Box>
      <AvatarIcon
        marginBottom={4}
        backgroundColor={BackgroundColor.primaryMuted}
        iconName={IconName.Hardware}
        color={IconColor.infoDefault}
        size={AvatarIconSize.Xl}
      />
      <Text
        variant={TextVariant.headingSm}
        fontWeight={FontWeight.Bold}
        paddingBottom={2}
      >
        Cold storage. Fast access.
      </Text>
      <Text variant={TextVariant.bodyMd} color={TextColor.textAlternativeSoft}>
        Remote Mode lets you use your hardware wallet without plugging it in.
      </Text>
      <Box marginTop={4} marginBottom={6}>
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.flexStart}
          gap={2}
          paddingTop={2}
          paddingBottom={2}
        >
          <Icon name={IconName.SwapHorizontal} color={IconColor.infoDefault} />
          <Text
            fontWeight={FontWeight.Bold}
            style={{ display: 'inline-block' }}
          >
            Stay secure.
          </Text>{' '}
          Your keys stay offline, and your funds stay in cold storage.
        </Box>
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.flexStart}
          gap={2}
          paddingTop={2}
          paddingBottom={2}
        >
          <Icon name={IconName.WalletCard} color={IconColor.infoDefault} />
          <Text
            fontWeight={FontWeight.Bold}
            style={{ display: 'inline-block' }}
          >
            Move faster.
          </Text>{' '}
          Allow limited actions like swaps or approvals ahead of time.
        </Box>
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.flexStart}
          gap={2}
          paddingTop={2}
          paddingBottom={2}
        >
          <Icon name={IconName.SecurityTick} color={IconColor.infoDefault} />
          <Text
            fontWeight={FontWeight.Bold}
            style={{ display: 'inline-block' }}
          >
            Stay in control.
          </Text>{' '}
          Set your own rules, like spending caps and allowed actions.
        </Box>
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.flexStart}
          gap={2}
          paddingTop={2}
          paddingBottom={2}
        >
          <Icon name={IconName.Star} color={IconColor.infoDefault} />
          <Text
            fontWeight={FontWeight.Bold}
            style={{ display: 'inline-block' }}
          >
            Get smart.
          </Text>{' '}
          All the benefits of a smart account, and your keys stay safe.
        </Box>
      </Box>
    </Box>
  );
}
