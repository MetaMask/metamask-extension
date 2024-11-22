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
import { ConfirmInfoAlertRow } from '../../../../../../../components/app/confirm/info/row/alert-row/alert-row';
import { RowAlertKey } from '../../../../../../../components/app/confirm/info/row/constants';
import { ConfirmInfoSection } from '../../../../../../../components/app/confirm/info/row/section';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { selectPaymasterAddress } from '../../../../../../../selectors/account-abstraction';
import { selectConfirmationAdvancedDetailsOpen } from '../../../../../selectors/preferences';
import { useConfirmContext } from '../../../../../context/confirm';
import { useFourByte } from '../../hooks/useFourByte';
import { ConfirmInfoRowCurrency } from '../../../../../../../components/app/confirm/info/row/currency';
import { PRIMARY } from '../../../../../../../helpers/constants/common';
import { useUserPreferencedCurrency } from '../../../../../../../hooks/useUserPreferencedCurrency';
import { HEX_ZERO } from '../constants';
import { SigningInWithRow } from '../sign-in-with-row/sign-in-with-row';

export const OriginRow = () => {
  const t = useI18nContext();

  const { currentConfirmation } = useConfirmContext<TransactionMeta>();

  const origin = currentConfirmation?.origin;

  if (!origin) {
    return null;
  }

  return (
    <ConfirmInfoAlertRow
      alertKey={RowAlertKey.RequestFrom}
      ownerId={currentConfirmation.id}
      data-testid="transaction-details-origin-row"
      label={t('requestFrom')}
      tooltip={t('requestFromTransactionDescription')}
    >
      <ConfirmInfoRowUrl url={origin} />
    </ConfirmInfoAlertRow>
  );
};

export const RecipientRow = () => {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();

  if (
    !currentConfirmation?.txParams?.to ||
    !isValidAddress(currentConfirmation?.txParams?.to ?? '')
  ) {
    return null;
  }

  const { chainId } = currentConfirmation;

  return (
    <ConfirmInfoRow
      data-testid="transaction-details-recipient-row"
      label={t('interactingWith')}
      tooltip={t('interactingWithTransactionDescription')}
    >
      <ConfirmInfoRowAddress
        address={currentConfirmation.txParams.to}
        chainId={chainId}
      />
    </ConfirmInfoRow>
  );
};

export const MethodDataRow = () => {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
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

const AmountRow = () => {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { currency } = useUserPreferencedCurrency(PRIMARY);

  const value = currentConfirmation?.txParams?.value;
  const simulationData = currentConfirmation?.simulationData;

  if (!value || value === HEX_ZERO || !simulationData?.error) {
    return null;
  }

  return (
    <ConfirmInfoSection>
      <ConfirmInfoRow
        data-testid="transaction-details-amount-row"
        label={t('amount')}
      >
        <ConfirmInfoRowCurrency value={value} currency={currency} />
      </ConfirmInfoRow>
    </ConfirmInfoSection>
  );
};

const PaymasterRow = () => {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();

  const { id: userOperationId, chainId } = currentConfirmation ?? {};
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
        <ConfirmInfoRowAddress address={paymasterAddress} chainId={chainId} />
      </ConfirmInfoRow>
    </ConfirmInfoSection>
  );
};

export const TransactionDetails = () => {
  const showAdvancedDetails = useSelector(
    selectConfirmationAdvancedDetailsOpen,
  );

  return (
    <>
      <ConfirmInfoSection data-testid="transaction-details-section">
        <OriginRow />
        <RecipientRow />
        {showAdvancedDetails && <MethodDataRow />}
        <SigningInWithRow />
      </ConfirmInfoSection>
      <AmountRow />
      <PaymasterRow />
    </>
  );
};
