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
import HeaderInfo from './header-info';

const Header = () => {
  const { networkImageUrl, networkDisplayName } = useConfirmationNetworkInfo();
  const { recipientAddress, recipientName } = useConfirmationRecipientInfo();

  return (
    <Box
      alignItems={AlignItems.center}
      display={Display.Grid}
      padding={4}
      className="confirm_header__wrapper"
    >
      <Box display={Display.Flex} alignItems={AlignItems.center}>
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
      <HeaderInfo />
    </Box>
  );
};

export default Header;
