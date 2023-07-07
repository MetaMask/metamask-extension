import React from 'react';
import PropTypes from 'prop-types';
import {
  AvatarAccount,
  Box,
  Text,
  AvatarAccountSize,
} from '../../component-library';
import {
  AlignItems,
  BorderColor,
  Display,
  FlexDirection,
} from '../../../helpers/constants/design-system';
import { shortenAddress } from '../../../helpers/utils/util';
import Tooltip from '../../ui/tooltip/tooltip';

export const ConfirmationInlineAddress = ({ address }) => (
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
      <Text marginLeft={2}>{shortenAddress(address)}</Text>
    </Tooltip>
  </Box>
);

ConfirmationInlineAddress.propTypes = {
  address: PropTypes.string.isRequired,
};
