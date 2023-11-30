import React from 'react';

import useConfirmationNetworkInfo from '../../../../hooks/confirm/useConfirmationNetworkInfo';
import useConfirmationRecipientInfo from '../../../../hooks/confirm/useConfirmationRecipientInfo';
import {
  AlignItems,
  Display,
  TextVariant,
} from '../../../../helpers/constants/design-system';

import Identicon from '../../../ui/identicon';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  Text,
} from '../../../component-library';

const Header = () => {
  const { networkImageUrl, networkDisplayName } = useConfirmationNetworkInfo();
  const { recipientAddress, recipientName } = useConfirmationRecipientInfo();

  return (
    <Box
      alignItems={AlignItems.center}
      display={Display.Flex}
      padding={4}
      className="confirm_header-wrapper"
    >
      <Box display={Display.Flex}>
        <Identicon address={recipientAddress} diameter={32} />
        <AvatarNetwork
          src={networkImageUrl}
          name={networkDisplayName}
          size={AvatarNetworkSize.Xs}
          className="confirm_header-avatar_network"
        />
      </Box>
      <Box marginLeft={4}>
        <Text variant={TextVariant.headingSm}>{recipientName}</Text>
        <Text variant={TextVariant.bodyMd}>{networkDisplayName}</Text>
      </Box>
    </Box>
  );
};

export default Header;
