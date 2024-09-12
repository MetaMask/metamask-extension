import React, { memo, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { TransactionType } from '@metamask/transaction-controller';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  accountsWithSendEtherInfoSelector,
  getSelectedInternalAccount,
} from '../../../selectors';
import {
  getAccountByAddress,
  shortenAddress,
} from '../../../helpers/utils/util';
import { useConfirmContext } from '../../../pages/confirmations/context/confirm';
import { SignatureRequestType } from '../../../pages/confirmations/types/confirm';
import { isSIWESignatureRequest } from '../../../pages/confirmations/utils/confirm';
import { BannerAlert } from '../../component-library';

const MMISignatureMismatchBanner: React.FC = memo(() => {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<SignatureRequestType>();
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const allAccounts = useSelector(accountsWithSendEtherInfoSelector);

  const fromAccount = useMemo(() => {
    /**
     * SIWE has its own account mismatch alert that checks the selected address and the address
     * in the parsed message rather than the selected address and the from address
     */
    const isSIWE = isSIWESignatureRequest(currentConfirmation);

    if (
      !currentConfirmation ||
      isSIWE ||
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
