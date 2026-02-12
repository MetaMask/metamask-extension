import React from 'react';
import { toChecksumHexAddress } from '@metamask/controller-utils';
import { Box, Text } from '../../component-library';
import { PreferredAvatar } from '../../app/preferred-avatar';
import {
  Display,
  JustifyContent,
  FlexDirection,
  AlignItems,
  TextVariant,
  TextAlign,
  TextColor,
} from '../../../helpers/constants/design-system';
import { shortenAddress } from '../../../helpers/utils/util';

export type NotificationsSettingsAccountProps = {
  address: string;
  name?: string;
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export function NotificationsSettingsAccount({
  address,
  name,
}: NotificationsSettingsAccountProps) {
  const checksumAddress = toChecksumHexAddress(address);
  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      alignItems={AlignItems.center}
      gap={4}
    >
      <PreferredAvatar address={checksumAddress} />
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.flexStart}
        justifyContent={JustifyContent.spaceBetween}
      >
        <Text variant={TextVariant.bodyLgMedium} textAlign={TextAlign.Left}>
          {name ?? checksumAddress}
        </Text>
        <Text
          variant={TextVariant.bodyMd}
          textAlign={TextAlign.Left}
          color={TextColor.textAlternative}
        >
          {shortenAddress(checksumAddress)}
        </Text>
      </Box>
    </Box>
  );
}
