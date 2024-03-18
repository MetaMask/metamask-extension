import React from 'react';

import useConfirmationNetworkInfo from '../../../hooks/useConfirmationNetworkInfo';
import useConfirmationRecipientInfo from '../../../hooks/useConfirmationRecipientInfo';
import {
  AlignItems,
  Display,
  JustifyContent,
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
  const { recipientAddress: fromAddress, recipientName: fromName } =
    useConfirmationRecipientInfo();

  return (
    <Box
      display={Display.Flex}
      className="confirm_header__wrapper"
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.spaceBetween}
    >
      <Box alignItems={AlignItems.flexStart} display={Display.Flex} padding={4}>
        <Box display={Display.Flex} marginTop={2}>
          <Identicon address={fromAddress} diameter={32} />
          <AvatarNetwork
            src={networkImageUrl}
            name={networkDisplayName}
            size={AvatarNetworkSize.Xs}
            className="confirm_header__avatar-network"
          />
        </Box>
        <Box marginInlineStart={4}>
          <Text>{fromName}</Text>
          <Text color={TextColor.textAlternative}>{networkDisplayName}</Text>
        </Box>
      </Box>
      <Box alignItems={AlignItems.flexEnd} display={Display.Flex} padding={4}>
        <HeaderInfo />
      </Box>
    </Box>
  );
};

export default Header;
