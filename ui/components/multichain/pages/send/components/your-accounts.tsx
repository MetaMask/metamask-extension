import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Label } from '../../../../component-library';
import { getMetaMaskAccountsOrdered } from '../../../../../selectors';
import { AccountListItem } from '../../..';
import { I18nContext } from '../../../../../contexts/i18n';
import {
  addHistoryEntry,
  updateRecipient,
  updateRecipientUserInput,
} from '../../../../../ducks/send';
import { SendPageRow } from '.';

export const SendPageYourAccount = () => {
  const t = useContext(I18nContext);
  const dispatch = useDispatch();

  // Your Accounts
  const accounts = useSelector(getMetaMaskAccountsOrdered);

  return (
    <SendPageRow>
      <Label paddingBottom={2}>{t('yourAccounts')}</Label>
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
