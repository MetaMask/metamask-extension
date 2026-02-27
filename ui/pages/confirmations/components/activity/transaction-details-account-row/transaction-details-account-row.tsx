import React from 'react';
import { useSelector } from 'react-redux';
import { Text } from '../../../../../components/component-library';
import {
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  getAccountName,
  getInternalAccounts,
  getIsMultichainAccountsState2Enabled,
} from '../../../../../selectors';
import type { MultichainAccountsState } from '../../../../../selectors/multichain-accounts/account-tree.types';
import {
  selectAccountGroupNameByInternalAccount,
} from '../../../selectors/accounts';
import { TransactionDetailsRow } from '../transaction-details-row';
import { useTransactionDetails } from '../transaction-details-context';

// eslint-disable-next-line @typescript-eslint/naming-convention
export function TransactionDetailsAccountRow() {
  const t = useI18nContext();
  const { transactionMeta } = useTransactionDetails();
  const internalAccounts = useSelector(getInternalAccounts);
  const isMultichainAccountsState2Enabled = useSelector(
    getIsMultichainAccountsState2Enabled,
  );

  const {
    txParams: { from },
  } = transactionMeta;

  const accountGroupName = useSelector((state: MultichainAccountsState) =>
    selectAccountGroupNameByInternalAccount(state, from),
  );
  const internalAccountName = getAccountName(internalAccounts, from);
  const accountName = isMultichainAccountsState2Enabled
    ? accountGroupName ?? internalAccountName
    : internalAccountName;

  return (
    <TransactionDetailsRow
      label={t('account')}
      data-testid="transaction-details-account-row"
    >
      <Text variant={TextVariant.bodyMd} color={TextColor.textAlternative}>
        {accountName ?? from}
      </Text>
    </TransactionDetailsRow>
  );
}
