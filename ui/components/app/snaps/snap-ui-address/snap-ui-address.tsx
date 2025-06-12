import React, { useMemo } from 'react';
import {
  CaipAccountId,
  isHexString,
  parseCaipAccountId,
} from '@metamask/utils';
import { Box, Text } from '../../../component-library';
import {
  AlignItems,
  Display,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { shortenAddress } from '../../../../helpers/utils/util';
import { toChecksumHexAddress } from '../../../../../shared/modules/hexstring-utils';
import { SnapUIAvatar } from '../snap-ui-avatar';
import { useDisplayName } from '../../../../hooks/snaps/useDisplayName';

export type SnapUIAddressProps = {
  // The address must be a CAIP-10 string.
  address: string;
  // This is not currently exposed to Snaps.
  avatarSize?: 'xs' | 'sm' | 'md' | 'lg';
  truncate?: boolean;
  displayName?: boolean;
  avatar?: boolean;
};

export const SnapUIAddress: React.FunctionComponent<SnapUIAddressProps> = ({
  address,
  avatarSize = 'md',
  truncate = true,
  displayName = false,
  avatar = true,
}) => {
  const caipIdentifier = useMemo(() => {
    if (isHexString(address)) {
      // For legacy address inputs we assume them to be Ethereum addresses.
      // NOTE: This means the chain ID is not gonna be reliable.
      return `eip155:1:${address}`;
    }

    return address;
  }, [address]);

  const parsed = useMemo(
    () => parseCaipAccountId(caipIdentifier as CaipAccountId),
    [caipIdentifier],
  );

  const name = useDisplayName(parsed);

  // For EVM addresses, we make sure they are checksummed.
  const transformedAddress =
    parsed.chain.namespace === 'eip155'
      ? toChecksumHexAddress(parsed.address)
      : parsed.address;

  const formattedAddress = truncate
    ? shortenAddress(transformedAddress)
    : address;

  return (
    <Box
      className="snap-ui-renderer__address"
      data-testid="snap-ui-address"
      display={Display.Flex}
      alignItems={AlignItems.center}
      gap={2}
    >
      {avatar && <SnapUIAvatar address={caipIdentifier} size={avatarSize} />}
      <Text
        variant={TextVariant.bodyMd}
        color={TextColor.inherit}
        style={{ lineBreak: 'anywhere' }}
      >
        {displayName && name ? name : formattedAddress}
      </Text>
    </Box>
  );
};
