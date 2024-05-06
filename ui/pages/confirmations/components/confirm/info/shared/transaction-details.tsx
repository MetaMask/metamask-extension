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
import { useKnownMethodDataInTransaction } from '../hooks/known-method-data-in-transaction';

const OriginRow = () => {
  const t = useI18nContext();

  const currentConfirmation = useSelector(
    currentConfirmationSelector,
  ) as TransactionMeta;

  const origin = currentConfirmation?.origin;

  if (!origin) {
    return null;
  }

  return (
    <ConfirmInfoRow
      label={t('requestFrom')}
      tooltip={t('requestFromTransactionDescription')}
    >
      <ConfirmInfoRowUrl url={origin} />
    </ConfirmInfoRow>
  );
};

const RecipientRow = () => {
  const t = useI18nContext();

  const currentConfirmation = useSelector(
    currentConfirmationSelector,
  ) as TransactionMeta;

  if (
    !currentConfirmation?.txParams?.to ||
    !isValidAddress(currentConfirmation?.txParams?.to ?? '')
  ) {
    return null;
  }

  return (
    <ConfirmInfoRow
      label={t('interactingWith')}
      tooltip={t('interactingWithTransactionDescription')}
    >
      <ConfirmInfoRowAddress address={currentConfirmation.txParams.to} />
    </ConfirmInfoRow>
  );
};

const MethodDataRow = () => {
  const t = useI18nContext();

  const currentConfirmation = useSelector(
    currentConfirmationSelector,
  ) as TransactionMeta;

  const { knownMethodData } =
    useKnownMethodDataInTransaction(currentConfirmation);

  if (!knownMethodData?.name) {
    return null;
  }

  return (
    <ConfirmInfoRow
      label={t('methodData')}
      tooltip={t('methodDataTransactionDescription')}
    >
      <ConfirmInfoRowText text={knownMethodData.name} />
    </ConfirmInfoRow>
  );
};

export const TransactionDetails = () => {
  return (
    <>
      <OriginRow />
      <RecipientRow />
      <MethodDataRow />
    </>
  );
};
