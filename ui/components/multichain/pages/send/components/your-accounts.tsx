import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  getUpdatedAndSortedAccounts,
  getInternalAccounts,
} from '../../../../../selectors';
import { AccountListItem } from '../../..';
import {
  addHistoryEntry,
  updateRecipient,
  updateRecipientUserInput,
} from '../../../../../ducks/send';
import { mergeAccounts } from '../../../account-list-menu/account-list-menu';
import { SendPageRow } from '.';

export const SendPageYourAccounts = () => {
  const dispatch = useDispatch();

  // Your Accounts
  const accounts = useSelector(getUpdatedAndSortedAccounts);
  const internalAccounts = useSelector(getInternalAccounts);
  const mergedAccounts = mergeAccounts(accounts, internalAccounts);

  return (
    <SendPageRow>
      {mergedAccounts.map((account: any) => (
        <AccountListItem
          identity={account}
          key={account.address}
          isPinned={Boolean(account.pinned)}
          onClick={() => {
            dispatch(
              addHistoryEntry(
                `sendFlow - User clicked recipient from my accounts. address: ${account.address}, nickname ${account.name}`,
              ),
            );
            dispatch(
              updateRecipient({
                address: account.address,
                nickname: account.name,
              }),
            );
            dispatch(updateRecipientUserInput(account.address));
          }}
        />
      ))}
    </SendPageRow>
  );
};
