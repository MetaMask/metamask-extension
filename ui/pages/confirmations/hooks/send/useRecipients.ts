import { KeyringAccountType } from '@metamask/keyring-api';
import { useContactRecipients } from './useContactRecipients';
import { useAccountRecipients } from './useAccountRecipients';

export type Recipient = {
  accountGroupName?: string;
  accountType?: KeyringAccountType;
  address: string;
  contactName?: string;
  isContact?: boolean;
  walletName?: string;
};

export const useRecipients = (): Recipient[] => {
  const contactRecipients = useContactRecipients();
  const accountRecipients = useAccountRecipients();

  return [...contactRecipients, ...accountRecipients];
};
