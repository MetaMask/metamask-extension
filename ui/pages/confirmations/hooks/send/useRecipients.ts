import { useContactRecipients } from './useContactRecipients';
import { useAccountRecipients } from './useAccountRecipients';

export type Recipient = {
  accountGroupName?: string;
  address: string;
  contactName?: string;
  walletName?: string;
};

export const useRecipients = (): Recipient[] => {
  const contactRecipients = useContactRecipients();
  const accountRecipients = useAccountRecipients();

  return [...contactRecipients, ...accountRecipients];
};
