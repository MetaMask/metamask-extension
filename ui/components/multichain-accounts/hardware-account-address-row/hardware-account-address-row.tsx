import React from 'react';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  FontWeight,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { shortenString } from '../../../helpers/utils/util';
import type { HardwareAccountAddressRowProps } from './hardware-account-address-row.types';

/**
 * Address row for a hardware wallet account card.
 * @param options0
 * @param options0.address
 */
export const HardwareAccountAddressRow = ({
  address,
}: HardwareAccountAddressRowProps) => {
  const truncatedAddress = shortenString(address.address, {
    truncatedStartChars: 5,
    truncatedEndChars: 4,
    truncatedCharLimit: 4,
    skipCharacterInEnd: false,
  });

  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      gap={4}
      className="min-h-[46px] w-full"
      data-testid="hardware-account-address-row"
    >
      <AvatarNetwork
        name={address.networkName}
        src={address.iconUrl}
        size={AvatarNetworkSize.Lg}
      />
      <Box flexDirection={BoxFlexDirection.Column} className="min-w-0 flex-1">
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          className="min-w-0 gap-1.5"
        >
          <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
            {address.networkName}
          </Text>
          {address.addressType ? (
            <Box
              backgroundColor={BoxBackgroundColor.BackgroundMuted}
              className="rounded px-1.5"
            >
              <Text
                variant={TextVariant.BodyXs}
                fontWeight={FontWeight.Medium}
                color={TextColor.TextAlternative}
              >
                {address.addressType}
              </Text>
            </Box>
          ) : null}
        </Box>
        <Text
          variant={TextVariant.BodySm}
          fontWeight={FontWeight.Medium}
          color={TextColor.TextAlternative}
        >
          {truncatedAddress}
        </Text>
      </Box>
      <Text
        variant={TextVariant.BodyMd}
        fontWeight={FontWeight.Medium}
        className="shrink-0 text-right"
      >
        {address.balance}
      </Text>
    </Box>
  );
};
