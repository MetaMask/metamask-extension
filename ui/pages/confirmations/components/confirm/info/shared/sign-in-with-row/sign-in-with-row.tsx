import React from 'react';

import { ConfirmInfoRowAddress } from '../../../../../../../components/app/confirm/info/row';
import { ConfirmInfoAlertRow } from '../../../../../../../components/app/confirm/info/row/alert-row/alert-row';
import { RowAlertKey } from '../../../../../../../components/app/confirm/info/row/constants';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { isSIWESignatureRequest } from '../../../../../utils';
import { useSignatureRequest } from '../../../../../hooks/signatures/useSignatureRequest';
import { useUnapprovedTransaction } from '../../../../../hooks/transactions/useUnapprovedTransaction';
import { useApprovalRequest } from '../../../../../hooks/useApprovalRequest';

export const SigningInWithRow = () => {
  const t = useI18nContext();

  const approvalRequest = useApprovalRequest();
  const signatureRequest = useSignatureRequest();
  const transactionMeta = useUnapprovedTransaction();
  const isSIWE = isSIWESignatureRequest(signatureRequest);

  const chainId =
    signatureRequest?.chainId ?? transactionMeta?.chainId ?? '0x0';

  const from =
    transactionMeta?.txParams?.from ?? signatureRequest?.msgParams?.from;

  if (!approvalRequest || !from) {
    return null;
  }

  return (
    <ConfirmInfoAlertRow
      alertKey={RowAlertKey.SigningInWith}
      label={isSIWE ? t('signingInWith') : t('signingWith')}
      ownerId={approvalRequest.id}
      isShownWithAlertsOnly={!isSIWE}
    >
      <ConfirmInfoRowAddress address={from} chainId={chainId} />
    </ConfirmInfoAlertRow>
  );
};
