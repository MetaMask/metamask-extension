import { TransactionMeta } from '@metamask/transaction-controller';
import { isValidAddress } from 'ethereumjs-util';
import React from 'react';
import { useSelector } from 'react-redux';
import {
  ConfirmInfoRow,
  ConfirmInfoRowAddress,
  ConfirmInfoRowText,
  ConfirmInfoRowUrl,
} from '../../../../../../../components/app/confirm/info/row';
import { ConfirmInfoSection } from '../../../../../../../components/app/confirm/info/row/section';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { selectPaymasterAddress } from '../../../../../../../selectors/account-abstraction';
import { currentConfirmationSelector } from '../../../../../selectors';
import { useFourByte } from '../../hooks/useFourByte';

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
      data-testid="transaction-details-origin-row"
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
      data-testid="transaction-details-recipient-row"
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

  const methodData = useFourByte(currentConfirmation);

  if (!methodData?.name) {
    return null;
  }

  return (
    <ConfirmInfoRow
      data-testid="transaction-details-method-data-row"
      label={t('methodData')}
      tooltip={t('methodDataTransactionDesc')}
    >
      <ConfirmInfoRowText text={methodData.name} />
    </ConfirmInfoRow>
  );
};

const PaymasterRow = () => {
  const t = useI18nContext();

  const currentConfirmation = useSelector(currentConfirmationSelector) as
    | TransactionMeta
    | undefined;

  const { id: userOperationId } = currentConfirmation ?? {};
  const isUserOperation = Boolean(currentConfirmation?.isUserOperation);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const paymasterAddress = useSelector((state: any) =>
    selectPaymasterAddress(state, userOperationId as string),
  );

  if (!isUserOperation || !paymasterAddress) {
    return null;
  }

  return (
    <ConfirmInfoSection>
      <ConfirmInfoRow
        data-testid="transaction-details-paymaster-row"
        label={t('confirmFieldPaymaster')}
        tooltip={t('confirmFieldTooltipPaymaster')}
      >
        <ConfirmInfoRowAddress address={paymasterAddress} />
      </ConfirmInfoRow>
    </ConfirmInfoSection>
  );
};

export const TransactionDetails = () => {
  return (
    <>
      <ConfirmInfoSection data-testid="transaction-details-section">
        <OriginRow />
        <RecipientRow />
        <MethodDataRow />
      </ConfirmInfoSection>
      <PaymasterRow />
    </>
  );
};
