import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { getUnconnectedAccounts } from '../../../selectors/selectors';
import { ConnectAccountsModalList } from './connect-accounts-modal-list';

export const ConnectAccountsModal = ({ onClose }: { onClose: () => void }) => {
  const accounts = useSelector(getUnconnectedAccounts);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);

  const handleAccountClick = (address: string) => {
    const index = selectedAccounts.indexOf(address);
    let newSelectedAccounts: string[] = [];

    if (index === -1) {
      // If address is not already selected, add it to the selectedAccounts array
      newSelectedAccounts = [...selectedAccounts, address];
    } else {
      // If address is already selected, remove it from the selectedAccounts array
      newSelectedAccounts = selectedAccounts.filter(
        (_item, idx) => idx !== index,
      );
    }

    setSelectedAccounts(newSelectedAccounts);
  };

  const selectAll = () => {
    const newSelectedAccounts = accounts.map(
      (account: { address: string }) => account.address,
    );
    setSelectedAccounts(newSelectedAccounts);
  };

  const deselectAll = () => {
    setSelectedAccounts([]);
  };

  const allAreSelected = () => {
    return accounts.length === selectedAccounts.length;
  };
  let checked = false;
  let isIndeterminate = false;
  if (allAreSelected()) {
    checked = true;
    isIndeterminate = false;
  } else if (selectedAccounts.length > 0 && !allAreSelected()) {
    checked = false;
    isIndeterminate = true;
  }
  return (
    <ConnectAccountsModalList
      accounts={accounts}
      selectedAccounts={selectedAccounts}
      allAreSelected={allAreSelected}
      deselectAll={deselectAll}
      selectAll={selectAll}
      handleAccountClick={handleAccountClick}
      checked={checked}
      isIndeterminate={isIndeterminate}
      onClose={onClose}
    />
  );
};
