import React, { useContext } from 'react';
import { useSelector } from 'react-redux';
import { Label } from '../../../../component-library';
import { getMetaMaskAccountsOrdered } from '../../../../../selectors';
import { AccountListItem } from '../../..';
import { I18nContext } from '../../../../../contexts/i18n';
import { SendPageRow } from '.';

export const SendPageYourAccount = () => {
  const t = useContext(I18nContext);

  // Your Accounts
  const accounts = useSelector(getMetaMaskAccountsOrdered);

  return (
    <SendPageRow>
      <Label paddingBottom={2}>{t('yourAccounts')}</Label>
      {accounts.map((account: any) => (
        <AccountListItem
          identity={account}
          key={account.address}
          onClick={() => undefined}
        />
      ))}
    </SendPageRow>
  );
};
