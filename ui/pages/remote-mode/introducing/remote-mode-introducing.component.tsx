// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
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

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
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
      <Text variant={TextVariant.headingSm} fontWeight={FontWeight.Bold}>
        Introducing Remote Mode
      </Text>
      <Text variant={TextVariant.bodyMd} color={TextColor.textAlternativeSoft}>
        Safely access your hardware wallet funds without plugging it in.
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
          <Text>
            Easier yet safe to trade with cold funds. Never miss a market
            opportunity.
          </Text>
        </Box>
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.flexStart}
          gap={2}
          paddingTop={2}
          paddingBottom={2}
        >
          <Icon name={IconName.WalletCard} color={IconColor.infoDefault} />
          <Text>
            Use allowances for transactions, limiting exposure of cold funds &
            keys.
          </Text>
        </Box>
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.flexStart}
          gap={2}
          paddingTop={2}
          paddingBottom={2}
        >
          <Icon name={IconName.SecurityTick} color={IconColor.infoDefault} />
          <Text>
            Set your terms with spending caps & other smart contract enforced
            rules.
          </Text>
        </Box>
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.flexStart}
          gap={2}
          paddingTop={2}
          paddingBottom={2}
        >
          <Icon name={IconName.Star} color={IconColor.infoDefault} />
          <Text>
            Get all the benefits of a smart account, and switch back anytime.
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
