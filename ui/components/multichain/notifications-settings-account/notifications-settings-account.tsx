import React from 'react';
import { toChecksumHexAddress } from '@metamask/controller-utils';
import {
  Box,
  Text,
  BoxFlexDirection,
  BoxAlignItems,
  BoxJustifyContent,
  TextVariant,
  TextAlign,
  TextColor,
  FontWeight,
} from '@metamask/design-system-react';
import { PreferredAvatar } from '../../app/preferred-avatar';
import { shortenAddress } from '../../../helpers/utils/util';

export type NotificationsSettingsAccountProps = {
  address: string;
  name?: string;
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860

export function NotificationsSettingsAccount({
  address,
  name,
}: NotificationsSettingsAccountProps) {
  const checksumAddress = toChecksumHexAddress(address);
  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      gap={3}
      paddingTop={2}
      paddingBottom={2}
    >
      <PreferredAvatar address={checksumAddress} />
      <Box
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Start}
        justifyContent={BoxJustifyContent.Between}
      >
        <Text
          variant={TextVariant.BodyMd}
          fontWeight={FontWeight.Medium}
          textAlign={TextAlign.Left}
        >
          {name ?? checksumAddress}
        </Text>
        <Text
          variant={TextVariant.BodySm}
          fontWeight={FontWeight.Regular}
          textAlign={TextAlign.Left}
          color={TextColor.TextAlternative}
        >
          {shortenAddress(checksumAddress)}
        </Text>
      </Box>
    </Box>
  );
}
