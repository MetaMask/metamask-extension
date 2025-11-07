import React from 'react';
import { AvatarAccountSize } from '@metamask/design-system-react';
import { KeyringAccountType } from '@metamask/keyring-api';

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
import { accountTypeLabel } from '../../../constants/network';
import { AccountTypeLabel } from '../account-type-label';

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
  const { address, seedIcon } = recipient;
  const recipientName = isAccount
    ? recipient.accountGroupName
    : recipient.contactName;
  const typeLabel =
    accountTypeLabel[recipient.accountType as KeyringAccountType];

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
      <PreferredAvatar
        address={seedIcon ?? address}
        size={AvatarAccountSize.Lg}
        data-testid="avatar"
      />
      <Box>
        <Text variant={TextVariant.bodyMdMedium}>{recipientName}</Text>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Row}
          alignItems={AlignItems.center}
        >
          <Text
            variant={TextVariant.bodySmMedium}
            color={TextColor.textAlternative}
            marginRight={2}
          >
            {shortenAddress(address)}
          </Text>
          <AccountTypeLabel label={typeLabel} />
        </Box>
      </Box>
    </Box>
  );
};
