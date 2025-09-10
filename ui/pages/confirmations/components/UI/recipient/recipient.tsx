import React from 'react';
import { AvatarAccountSize } from '@metamask/design-system-react';
import { PreferredAvatar } from '../../../../../components/app/preferred-avatar';
import { Box, Text } from '../../../../../components/component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  TextVariant,
  TextColor,
  BackgroundColor,
} from '../../../../../helpers/constants/design-system';
import { type Recipient as RecipientType } from '../../../hooks/send/useRecipients';
import { shortenAddress } from '../../../../../helpers/utils/util';

export const Recipient = ({
  isAccount,
  isSelected,
  recipient,
  onClick,
}: {
  isAccount?: boolean;
  isSelected?: boolean;
  recipient: RecipientType;
  onClick: (recipient: RecipientType) => void;
}) => {
  const { address } = recipient;
  const recipientName = isAccount
    ? recipient.accountGroupName
    : recipient.contactName;

  return (
    <Box
      alignItems={AlignItems.center}
      backgroundColor={
        isSelected
          ? BackgroundColor.backgroundHover
          : BackgroundColor.transparent
      }
      className="send-recipient"
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      paddingTop={3}
      paddingBottom={3}
      paddingLeft={4}
      paddingRight={4}
      gap={4}
      onClick={() => onClick(recipient)}
    >
      <PreferredAvatar address={address} size={AvatarAccountSize.Lg} />
      <Box>
        <Text variant={TextVariant.bodyMdMedium}>{recipientName}</Text>
        <Text
          variant={TextVariant.bodySmMedium}
          color={TextColor.textAlternative}
        >
          {shortenAddress(address)}
        </Text>
      </Box>
    </Box>
  );
};
