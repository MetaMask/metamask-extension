import React from 'react';
import {
  AvatarAccount,
  Box,
  Text,
  AvatarAccountSize,
} from '../../../../../component-library';
import {
  AlignItems,
  BorderColor,
  Display,
  FlexDirection,
  TextColor,
} from '../../../../../../helpers/constants/design-system';
import { shortenAddress } from '../../../../../../helpers/utils/util';
import Tooltip from '../../../../../ui/tooltip/tooltip';

export type ConfirmInfoRowAddressProps = {
  address: string;
};

export const ConfirmInfoRowAddress = ({
  address,
}: ConfirmInfoRowAddressProps) => (
  <Box
    display={Display.Flex}
    flexDirection={FlexDirection.Row}
    alignItems={AlignItems.center}
  >
    <AvatarAccount
      address={address}
      size={AvatarAccountSize.Xs}
      borderColor={BorderColor.transparent}
    />
    <Tooltip position="top" title={address} interactive>
      <Text marginLeft={2} color={TextColor.inherit}>
        {shortenAddress(address)}
      </Text>
    </Tooltip>
  </Box>
);
