import React from 'react';

import useConfirmationNetworkInfo from '../../../hooks/useConfirmationNetworkInfo';
import useConfirmationRecipientInfo from '../../../hooks/useConfirmationRecipientInfo';
import {
  AlignItems,
  Display,
  TextColor,
} from '../../../../../helpers/constants/design-system';

import Identicon from '../../../../../components/ui/identicon';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  Text,
} from '../../../../../components/component-library';

const Header = () => {
  const { networkImageUrl, networkDisplayName } = useConfirmationNetworkInfo();
  const { recipientAddress, recipientName } = useConfirmationRecipientInfo();

  return (
    <Box
      alignItems={AlignItems.center}
      display={Display.Flex}
      padding={4}
      className="confirm_header__wrapper"
    >
      <Box display={Display.Flex}>
        <Identicon address={recipientAddress} diameter={32} />
        <AvatarNetwork
          src={networkImageUrl}
          name={networkDisplayName}
          size={AvatarNetworkSize.Xs}
          className="confirm_header__avatar-network"
        />
      </Box>
      <Box marginInlineStart={4}>
        <Text>{recipientName}</Text>
        <Text color={TextColor.textAlternative}>{networkDisplayName}</Text>
      </Box>
    </Box>
  );
};

export default Header;
