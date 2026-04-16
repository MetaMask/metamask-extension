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

  if (recipient.contactName?.toLowerCase().includes(searchTerm)) {
    return true;
  }
  if (recipient.accountGroupName?.toLowerCase().includes(searchTerm)) {
    return true;
  }
  if (recipient.walletName?.toLowerCase().includes(searchTerm)) {
    return true;
  }
  if (recipient.address?.toLowerCase().includes(searchTerm)) {
    return true;
  }

  return false;
}
