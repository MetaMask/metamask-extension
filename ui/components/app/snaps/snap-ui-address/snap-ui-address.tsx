import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { CaipAccountId, parseCaipAccountId } from '@metamask/utils';
import { Box, Text } from '../../../component-library';
import {
  AlignItems,
  Display,
} from '../../../../helpers/constants/design-system';
import BlockieIdenticon from '../../../ui/identicon/blockieIdenticon';
import Jazzicon from '../../../ui/jazzicon';
import { getUseBlockie } from '../../../../selectors';
import { shortenAddress } from '../../../../helpers/utils/util';

export type SnapUIAddressProps = {
  // The address must be a CAIP-10 string.
  address: string;
  diameter?: number;
};

export const SnapUIAddress: React.FunctionComponent<SnapUIAddressProps> = ({ address, diameter = 32 }) => {
  const parsed = useMemo(() => parseCaipAccountId(address as CaipAccountId), [address]);
  const useBlockie = useSelector(getUseBlockie);

  return (
    <Box display={Display.Flex} alignItems={AlignItems.center} gap={2}>
      {useBlockie ? (
        <BlockieIdenticon
          address={parsed.address}
          diameter={diameter}
          borderRadius="50%"
        />
      ) : (
        <Jazzicon
          namespace={parsed.chain.namespace}
          address={parsed.address}
          diameter={diameter}
          style={{ display: 'flex' }}
        />
      )}
      <Text>{shortenAddress(parsed.address)}</Text>
    </Box>
  );
};
