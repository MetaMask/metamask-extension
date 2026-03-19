import React from 'react';
import { TransactionMeta } from '@metamask/transaction-controller';

import { ConfirmInfoRowAddress } from '../../../../../../../components/app/confirm/info/row';
import { ConfirmInfoAlertRow } from '../../../../../../../components/app/confirm/info/row/alert-row/alert-row';
import { RowAlertKey } from '../../../../../../../components/app/confirm/info/row/constants';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { useSignatureRequestOptional } from '../../../../../hooks/useSignatureRequest';
import { useTransactionMetadataRequestOptional } from '../../../../../hooks/useTransactionMetadataRequest';
import { SignatureRequestType } from '../../../../../types/confirm';
import { isSIWESignatureRequest } from '../../../../../utils';

export const SigningInWithRow = () => {
  const t = useI18nContext();

  const transactionMetadata = useTransactionMetadataRequestOptional();
  const signatureRequest = useSignatureRequestOptional();
  const currentConfirmation = transactionMetadata ?? signatureRequest;
  const isSIWE = isSIWESignatureRequest(currentConfirmation);

  const chainId = currentConfirmation?.chainId as string;
  const from =
    (currentConfirmation as TransactionMeta)?.txParams?.from ??
    (currentConfirmation as SignatureRequestType)?.msgParams?.from;

  if (!from) {
    return null;
  }

  return (
    <ConfirmInfoAlertRow
      alertKey={RowAlertKey.SigningInWith}
      label={isSIWE ? t('signingInWith') : t('signingWith')}
      ownerId={currentConfirmation?.id ?? ''}
      isShownWithAlertsOnly={!isSIWE}
    >
      <ConfirmInfoRowAddress address={from} chainId={chainId} />
    </ConfirmInfoAlertRow>
  );
};
