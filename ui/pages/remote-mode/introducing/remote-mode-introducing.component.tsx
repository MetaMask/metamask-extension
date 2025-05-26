import React from 'react';
import {
  Box,
  Text,
  Icon,
  IconName,
} from '../../../components/component-library';
import {
  AlignItems,
  FontWeight,
  TextVariant,
  Display,
  JustifyContent,
  TextColor,
  IconColor,
  FlexDirection,
} from '../../../helpers/constants/design-system';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function RemoteModeIntroducing() {
  return (
    <Box>
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
      >
        <img
          className="mm-box mm-box--margin-bottom-4 mm-box--width-1/5"
          src="./images/remote-mode.png"
        ></img>
        <Text
          variant={TextVariant.headingSm}
          fontWeight={FontWeight.Bold}
          paddingBottom={2}
        >
          Cold storage. Fast access.
        </Text>
        <Text
          variant={TextVariant.bodyMd}
          color={TextColor.textAlternativeSoft}
        >
          Remote Mode lets you use your hardware wallet without plugging it in.
        </Text>
      </Box>
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
            <span style={{ fontWeight: 'bold' }}>Stay secure.</span> Your keys
            stay offline, and your funds stay in cold storage.
          </Text>
        </Box>
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.flexStart}
          gap={2}
          paddingTop={2}
          paddingBottom={2}
        >
          <Icon name={IconName.Cash} color={IconColor.infoDefault} />
          <Text>
            <span style={{ fontWeight: 'bold' }}>Move faster.</span> Allow
            limited actions like swaps or approvals ahead of time.
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
            <span style={{ fontWeight: 'bold' }}>Stay in control.</span> Set
            your own rules, like spending caps and allowed actions.
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
            <span style={{ fontWeight: 'bold' }}>Get smart.</span> All the
            benefits of a smart account, and your keys stay safe.
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
