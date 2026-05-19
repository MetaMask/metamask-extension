import React from 'react';
import { useSelector } from 'react-redux';
import { Text } from '../../../../../components/component-library';
import {
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  getAllAccountGroups,
  getMultichainAccountGroupById,
  getSelectedAccountGroup,
  selectAccountGroupNameByAddress,
} from '../../../../../selectors/multichain-accounts/account-tree';
import type { MultichainAccountsState } from '../../../../../selectors/multichain-accounts/account-tree.types';
import { TransactionDetailsRow } from '../transaction-details-row';
import { useTransactionDetails } from '../transaction-details-context';

// eslint-disable-next-line @typescript-eslint/naming-convention
export function TransactionDetailsAccountRow() {
  const t = useI18nContext();
  const { transactionMeta } = useTransactionDetails();
  const hasPaymentDetails = Boolean(transactionMeta.metamaskPay);
  const selectedAccountGroupId = useSelector((state) =>
    getSelectedAccountGroup(state as MultichainAccountsState),
  );

  const {
    txParams: { from },
  } = transactionMeta;

  const accountName = useSelector((state) =>
    selectAccountGroupNameByAddress(state, from),
  );
  const selectedAccountGroupName = useSelector(
    (state) =>
      getMultichainAccountGroupById(
        state as MultichainAccountsState,
        selectedAccountGroupId,
      )?.metadata.name,
  );
  const firstAccountGroupName = useSelector(
    (state) =>
      getAllAccountGroups(state as MultichainAccountsState).find(
        (group) => group.metadata.name,
      )?.metadata.name,
  );

  const displayName =
    accountName || selectedAccountGroupName || firstAccountGroupName;

  if (!hasPaymentDetails || !displayName) {
    return null;
  }

  return (
    <TransactionDetailsRow
      label={t('account')}
      data-testid="transaction-details-account-row"
    >
      <Text variant={TextVariant.bodyMd} color={TextColor.textAlternative}>
        {displayName}
      </Text>
    </TransactionDetailsRow>
  );
}
