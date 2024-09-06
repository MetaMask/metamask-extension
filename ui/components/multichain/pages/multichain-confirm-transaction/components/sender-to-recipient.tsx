import React from 'react';
import {
  RecipientWithAddress,
  SenderAddress,
} from '../../../../ui/sender-to-recipient/sender-to-recipient.component';
import { Box, Icon, IconName } from '../../../../component-library';
import {
  BackgroundColor,
  Display,
} from '../../../../../helpers/constants/design-system';

export type MultichainSenderToRecipientProps = {
  senderAddress: string;
  addressOnly: boolean;
  senderName: string;
  onSenderClick: () => void;
  warnUserOnAccountMismatch: boolean;
  recipientAddress: string;
  recipientName?: string;
  onRecipientClick: () => void;
};

export const MultichainSenderToRecipient = ({
  senderAddress,
  addressOnly,
  senderName,
  onSenderClick,
  warnUserOnAccountMismatch,
  recipientAddress,
  recipientName,
  onRecipientClick,
}: MultichainSenderToRecipientProps) => {
  return (
    <Box
      backgroundColor={BackgroundColor.backgroundDefault}
      display={Display.Flex}
    >
      <SenderAddress
        checksummedSenderAddress={senderAddress}
        addressOnly={addressOnly}
        senderName={senderName}
        onSenderClick={onSenderClick}
        senderAddress={senderAddress}
        warnUserOnAccountMismatch={warnUserOnAccountMismatch}
      />
      <Icon name={IconName.ArrowRight} />
      <RecipientWithAddress
        checksummedRecipientAddress={recipientAddress}
        onRecipientClick={onRecipientClick}
        addressOnly={addressOnly}
        recipientName={recipientName}
      />
    </Box>
  );
};
