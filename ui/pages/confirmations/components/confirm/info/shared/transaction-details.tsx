import { TransactionMeta } from '@metamask/transaction-controller';
import { isValidAddress } from 'ethereumjs-util';
import React from 'react';
import { useSelector } from 'react-redux';
import {
  ConfirmInfoRow,
  ConfirmInfoRowAddress,
  ConfirmInfoRowText,
  ConfirmInfoRowUrl,
} from '../../../../../../components/app/confirm/info/row';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { currentConfirmationSelector } from '../../../../selectors';
import { useKnownMethodDataInTransaction } from '../../hooks';

export const TransactionDetails = () => {
  const t = useI18nContext();

  const currentConfirmation = useSelector(
    currentConfirmationSelector,
  ) as TransactionMeta;

  const { knownMethodData } =
    useKnownMethodDataInTransaction(currentConfirmation);

  return (
    <>
      {currentConfirmation?.origin ? (
        <ConfirmInfoRow
          label={t('requestFrom')}
          tooltip={t('requestFromTransactionDescription')}
        >
          <ConfirmInfoRowUrl url={currentConfirmation.origin} />
        </ConfirmInfoRow>
      ) : null}
      {currentConfirmation?.txParams.to &&
        isValidAddress(currentConfirmation.txParams.to) && (
          <ConfirmInfoRow
            label={t('interactingWith')}
            tooltip={t('interactingWithTransactionDescription')}
          >
            <ConfirmInfoRowAddress address={currentConfirmation.txParams.to} />
          </ConfirmInfoRow>
        )}
      {knownMethodData?.name && (
        <ConfirmInfoRow
          label={t('methodData')}
          tooltip={t('methodDataTransactionDescription')}
        >
          <ConfirmInfoRowText text={knownMethodData.name} />
        </ConfirmInfoRow>
      )}
    </>
  );
};
