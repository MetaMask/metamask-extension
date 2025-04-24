import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
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
import { HEX_ZERO } from '../constants';
import { hasValueAndNativeBalanceMismatch as checkValueAndNativeBalanceMismatch } from '../../utils';
import { NetworkRow } from '../network-row/network-row';
import { SigningInWithRow } from '../sign-in-with-row/sign-in-with-row';
import {
  AlignItems,
  BackgroundColor,
  BorderRadius,
  Display,
  FlexDirection,
  TextColor,
} from '../../../../../../../helpers/constants/design-system';
import { Box, Text } from '../../../../../../../components/component-library';
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
  const to = recipient ?? currentConfirmation?.txParams?.to;
  const isBatch = currentConfirmation?.type === TransactionType.batch;

  if (!to || !isValidAddress(to)) {
    return null;
  }

  const { chainId } = currentConfirmation;

  return (
    <ConfirmInfoAlertRow
      ownerId={currentConfirmation.id}
      alertKey={RowAlertKey.InteractingWith}
      data-testid="transaction-details-recipient-row"
      label={t('interactingWith')}
      tooltip={t('interactingWithTransactionDescription')}
    >
      {isBatch ? (
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

  if (currentConfirmation?.type === TransactionType.revokeDelegation) {
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

function SmartContractWithLogo() {
  const t = useI18nContext();
  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      alignItems={AlignItems.center}
      borderRadius={BorderRadius.pill}
      backgroundColor={BackgroundColor.backgroundAlternative}
      style={{
        padding: '1px 8px 1px 4px',
      }}
    >
      <img src="images/logo/metamask-fox.svg" width="16" height="16" />
      <Text marginLeft={2} color={TextColor.inherit}>
        {t('interactWithSmartContract')}
      </Text>
    </Box>
  );
}
