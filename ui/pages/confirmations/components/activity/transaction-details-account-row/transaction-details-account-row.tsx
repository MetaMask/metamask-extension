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
  const selectedAccountGroupId = useSelector((state) => {
    const multichainAccountsState = getMultichainAccountsState(state);
    return multichainAccountsState
      ? getSelectedAccountGroup(multichainAccountsState)
      : undefined;
  });

  const {
    txParams: { from },
  } = transactionMeta;

  const accountName = useSelector((state) => {
    const multichainAccountsState = getMultichainAccountsState(state);
    return multichainAccountsState
      ? selectAccountGroupNameByAddress(multichainAccountsState, from)
      : undefined;
  });
  const selectedAccountGroupName = useSelector((state) => {
    const multichainAccountsState = getMultichainAccountsState(state);

    if (!multichainAccountsState || !selectedAccountGroupId) {
      return undefined;
    }

    return getMultichainAccountGroupById(
      multichainAccountsState,
      selectedAccountGroupId,
    )?.metadata.name;
  });
  const firstAccountGroupName = useSelector((state) => {
    const multichainAccountsState = getMultichainAccountsState(state);
    return multichainAccountsState
      ? getAllAccountGroups(multichainAccountsState).find(
          (group) => group.metadata.name,
        )?.metadata.name
      : undefined;
  });

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

function getMultichainAccountsState(
  state: unknown,
): MultichainAccountsState | undefined {
  const maybeState = state as Partial<MultichainAccountsState>;

  return maybeState.metamask?.accountTree?.wallets
    ? (state as MultichainAccountsState)
    : undefined;
}
