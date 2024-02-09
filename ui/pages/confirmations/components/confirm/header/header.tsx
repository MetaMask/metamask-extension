import React from 'react';

import {
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  Text,
} from '../../../../../components/component-library';
import { Header as PageHeader } from '../../../../../components/multichain/pages/page';
import Identicon from '../../../../../components/ui/identicon';
import {
  Display,
  TextAlign,
  TextColor,
} from '../../../../../helpers/constants/design-system';
import useConfirmationNetworkInfo from '../../../hooks/useConfirmationNetworkInfo';
import useConfirmationRecipientInfo from '../../../hooks/useConfirmationRecipientInfo';

const Header = () => {
  const { networkImageUrl, networkDisplayName } = useConfirmationNetworkInfo();
  const { recipientAddress, recipientName } = useConfirmationRecipientInfo();

  return (
    <PageHeader
      className="confirm_header"
      startAccessory={
        <Box display={Display.Flex}>
          <Identicon address={recipientAddress} diameter={32} />
          <AvatarNetwork
            className="confirm_header__avatar-network"
            name={networkDisplayName}
            size={AvatarNetworkSize.Xs}
            src={networkImageUrl}
          />
        </Box>
      }
    >
      <Text textAlign={TextAlign.Left}>{recipientName}</Text>
      <Text textAlign={TextAlign.Left} color={TextColor.textAlternative}>
        {networkDisplayName}
      </Text>
    </PageHeader>
  );
};

export default Header;
