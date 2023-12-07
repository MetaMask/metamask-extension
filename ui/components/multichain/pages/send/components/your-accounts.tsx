import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getMetaMaskAccountsOrdered } from '../../../../../selectors';
import { AccountListItem } from '../../..';
import {
  addHistoryEntry,
  updateRecipient,
  updateRecipientUserInput,
} from '../../../../../ducks/send';
import { SendPageRow } from '.';

export const SendPageYourAccount = () => {
  const dispatch = useDispatch();

  // Your Accounts
  const accounts = useSelector(getMetaMaskAccountsOrdered);

  return (
    <SendPageRow>
      {accounts.map((account: any) => (
        <AccountListItem
          identity={account}
          key={account.address}
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
