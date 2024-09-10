import React, { useContext } from 'react';
import { TransactionNotice } from '../transaction-notice';
import { I18nContext } from '../../../../../../contexts/i18n';

export const BitcoinTransactionNotice = () => {
  const t = useContext(I18nContext);
  return <TransactionNotice notice={t('satProtection')} />;
};
