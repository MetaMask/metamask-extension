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
};

export const SnapUIAddress: React.FunctionComponent<SnapUIAddressProps> = ({
  address,
  avatarSize = 'md',
}) => {
  const caipIdentifier = useMemo(() => {
    if (isHexString(address)) {
      // For legacy address inputs we assume them to be Ethereum addresses.
      // NOTE: This means the chain ID is not gonna be reliable.
      return `eip155:1:${address}`;
    }

    return address;
  }, [address]);

  console.log('rerender');

  const parsed = useMemo(
    () => parseCaipAccountId(caipIdentifier as CaipAccountId),
    [caipIdentifier],
  );

  const displayName = useDisplayName(parsed);

  const value =
    displayName ??
    shortenAddress(
      parsed.chain.namespace === 'eip155'
        ? toChecksumHexAddress(parsed.address)
        : parsed.address,
    );

  return (
    <Box
      className="snap-ui-renderer__address"
      display={Display.Flex}
      alignItems={AlignItems.center}
      gap={2}
    >
      <SnapUIAvatar address={caipIdentifier} size={avatarSize} />
      <Text color={TextColor.inherit}>{value}</Text>
    </Box>
  );
};
