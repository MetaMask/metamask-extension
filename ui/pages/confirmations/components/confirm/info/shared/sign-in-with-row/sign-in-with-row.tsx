import React from 'react';

import { ConfirmInfoRowAddress } from '../../../../../../../components/app/confirm/info/row';
import { ConfirmInfoAlertRow } from '../../../../../../../components/app/confirm/info/row/alert-row/alert-row';
import { RowAlertKey } from '../../../../../../../components/app/confirm/info/row/constants';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { useSignatureRequestOptional } from '../../../../../hooks/useSignatureRequest';
import { isSIWESignatureRequest } from '../../../../../utils';

export const SigningInWithRow = () => {
  const t = useI18nContext();

  const signatureRequest = useSignatureRequestOptional();
  const isSIWE = isSIWESignatureRequest(signatureRequest);

  const chainId = signatureRequest?.chainId as string;
  const from = signatureRequest?.msgParams?.from;

  if (!from) {
    return null;
  }

  return (
    <ConfirmInfoAlertRow
      alertKey={RowAlertKey.SigningInWith}
      label={isSIWE ? t('signingInWith') : t('signingWith')}
      ownerId={signatureRequest?.id ?? ''}
      isShownWithAlertsOnly={!isSIWE}
    >
      <ConfirmInfoRowAddress address={from} chainId={chainId} />
    </ConfirmInfoAlertRow>
  );
};
