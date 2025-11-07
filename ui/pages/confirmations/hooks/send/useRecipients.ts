import { KeyringAccountType } from '@metamask/keyring-api';
import { useContactRecipients } from './useContactRecipients';
import { useAccountRecipients } from './useAccountRecipients';

export type Recipient = {
  accountGroupName?: string;
  accountType?: KeyringAccountType;
  address: string;
  contactName?: string;
  isContact?: boolean;
  seedIcon?: string;
  walletName?: string;
};

export const useRecipients = (): Recipient[] => {
  const accountRecipients = useAccountRecipients();
  const contactRecipients = useContactRecipients();

  const recipients = [...accountRecipients];

  contactRecipients.forEach((recipient) => {
    if (
      !recipients.some(
        (r) => r.address.toLowerCase() === recipient.address.toLowerCase(),
      )
    ) {
      recipients.push(recipient);
    }
  });

  return recipients;
};
