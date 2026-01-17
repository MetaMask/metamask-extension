import { useMemo } from 'react';

import { type Recipient } from './useRecipients';

type UseSendAssetFilterProps = {
  contactRecipients: Recipient[];
  accountRecipients: Recipient[];
  searchQuery?: string;
};

type FilteredAssets = {
  filteredContactRecipients: Recipient[];
  filteredAccountRecipients: Recipient[];
};

export const useSendRecipientFilter = ({
  contactRecipients,
  accountRecipients,
  searchQuery = '',
}: UseSendAssetFilterProps): FilteredAssets => {
  return useMemo(() => {
    const networkFilteredContactRecipients = contactRecipients;
    const networkFilteredAccountRecipients = accountRecipients;

    const filteredContactRecipients = networkFilteredContactRecipients.filter(
      (recipient) => matchesSearchQuery(recipient, searchQuery),
    );

    const filteredAccountRecipients = networkFilteredAccountRecipients.filter(
      (recipient) => matchesSearchQuery(recipient, searchQuery),
    );

    return {
      filteredContactRecipients,
      filteredAccountRecipients,
    };
  }, [accountRecipients, contactRecipients, searchQuery]);
};

function matchesSearchQuery(recipient: Recipient, query: string): boolean {
  if (!query.trim()) {
    return true;
  }

  const searchTerm = query.toLowerCase().trim();

  if (
    typeof recipient.contactName === 'string' &&
    recipient.contactName.toLowerCase().includes(searchTerm)
  ) {
    return true;
  }
  if (
    typeof recipient.accountGroupName === 'string' &&
    recipient.accountGroupName.toLowerCase().includes(searchTerm)
  ) {
    return true;
  }
  if (
    typeof recipient.walletName === 'string' &&
    recipient.walletName.toLowerCase().includes(searchTerm)
  ) {
    return true;
  }
  if (
    typeof recipient.address === 'string' &&
    recipient.address.toLowerCase().includes(searchTerm)
  ) {
    return true;
  }

  return false;
}
