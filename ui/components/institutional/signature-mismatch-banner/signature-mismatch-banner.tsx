import React, { memo, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { TransactionType } from '@metamask/transaction-controller';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  accountsWithSendEtherInfoSelector,
  currentConfirmationSelector,
  getSelectedInternalAccount,
} from '../../../selectors';
import {
  getAccountByAddress,
  shortenAddress,
} from '../../../helpers/utils/util';
import { BannerAlert } from '../../component-library';
import { SignatureRequestType } from '../../../pages/confirmations/types/confirm';

const MMISignatureMismatchBanner: React.FC = memo(() => {
  const t = useI18nContext();
  const currentConfirmation = useSelector(
    currentConfirmationSelector,
  ) as SignatureRequestType;
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const allAccounts = useSelector(accountsWithSendEtherInfoSelector);

  const fromAccount = useMemo(() => {
    // todo: as we add SIWE signatures to new designs we may need to exclude it from here
    if (
      !currentConfirmation ||
      (currentConfirmation.type !== TransactionType.personalSign &&
        currentConfirmation.type !== TransactionType.signTypedData) ||
      !currentConfirmation.msgParams
    ) {
      return null;
    }
    const {
      msgParams: { from },
    } = currentConfirmation;
    return getAccountByAddress(allAccounts, from);
  }, [currentConfirmation, allAccounts]);

  if (
    !selectedAccount ||
    !fromAccount ||
    selectedAccount.address === fromAccount.address
  ) {
    return null;
  }

  const message = t('mismatchAccount', [
    shortenAddress(selectedAccount?.address),
    shortenAddress(fromAccount?.address),
  ]);

  return <BannerAlert marginTop={3} title={message} />;
});

export default MMISignatureMismatchBanner;
