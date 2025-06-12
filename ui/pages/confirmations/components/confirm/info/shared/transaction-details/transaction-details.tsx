import { TransactionMeta } from '@metamask/transaction-controller';
import { isValidAddress } from 'ethereumjs-util';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Hex } from '@metamask/utils';
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
import { SmartContractWithLogo } from '../../../../smart-contract-with-logo';
import {
  useIsDowngradeTransaction,
  useIsUpgradeTransaction,
} from '../../hooks/useIsUpgradeTransaction';
import { HEX_ZERO } from '../constants';
import { hasValueAndNativeBalanceMismatch as checkValueAndNativeBalanceMismatch } from '../../utils';
import { NetworkRow } from '../network-row/network-row';
import { SigningInWithRow } from '../sign-in-with-row/sign-in-with-row';
import { isBatchTransaction } from '../../../../../../../../shared/lib/transactions.utils';

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

export const RecipientRow = ({ recipient }: { recipient?: Hex } = {}) => {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { isUpgradeOnly } = useIsUpgradeTransaction();
  const isDowngrade = useIsDowngradeTransaction();
  const { nestedTransactions, txParams, chainId, id } =
    currentConfirmation ?? {};
  const { from, to: txTo } = txParams ?? {};
  const to = recipient ?? txTo;

  const isBatch =
    isBatchTransaction(nestedTransactions) &&
    to?.toLowerCase() === from.toLowerCase();
  const showContractLogo = isBatch || isDowngrade || isUpgradeOnly;

  if (!to || !isValidAddress(to)) {
    return null;
  }

  return (
    <ConfirmInfoAlertRow
      ownerId={showContractLogo ? '' : id}
      alertKey={RowAlertKey.InteractingWith}
      data-testid="transaction-details-recipient-row"
      label={t('interactingWith')}
      tooltip={t('interactingWithTransactionDescription')}
    >
      {showContractLogo ? (
        <SmartContractWithLogo />
      ) : (
        <ConfirmInfoRowAddress address={to} chainId={chainId} />
      )}
    </ConfirmInfoAlertRow>
  );
};

export const MethodDataRow = () => {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { txParams } = currentConfirmation ?? {};
  const to = txParams?.to as Hex | undefined;
  const data = txParams?.data as Hex | undefined;
  const methodData = useFourByte({ to, data });

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

  if (!value || value === HEX_ZERO) {
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

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
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
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const hasValueAndNativeBalanceMismatch = useMemo(
    () => checkValueAndNativeBalanceMismatch(currentConfirmation),
    [currentConfirmation],
  );
  const { isUpgradeOnly } = useIsUpgradeTransaction();
  const isDowngrade = useIsDowngradeTransaction();

  if (isUpgradeOnly || isDowngrade) {
    return null;
  }
  const { nestedTransactions, txParams } = currentConfirmation ?? {};
  const { from, to } = txParams ?? {};

  const isBatch =
    isBatchTransaction(nestedTransactions) &&
    to?.toLowerCase() === from.toLowerCase();

  return (
    <>
      <ConfirmInfoSection data-testid="transaction-details-section">
        <NetworkRow isShownWithAlertsOnly />
        <OriginRow />
        {!isBatch && <RecipientRow />}
        {showAdvancedDetails && <MethodDataRow />}
        <SigningInWithRow />
      </ConfirmInfoSection>
      {(showAdvancedDetails || hasValueAndNativeBalanceMismatch) && (
        <AmountRow />
      )}
      <PaymasterRow />
    </>
  );
};
