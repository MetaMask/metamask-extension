import React, { useCallback } from 'react';
import { TransactionType } from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import {
  Skeleton,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';

import { hasTransactionType } from '../../../../../../shared/lib/transactions.utils';
import { formatPerpsFiat } from '../../../../../../shared/lib/perps-formatters';
import { updateEditableParams } from '../../../../../store/actions';
import { useDispatch } from '../../../../../store/hooks';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useTransactionMetadataRequestOptional } from '../../../hooks/transactions/useTransactionMetadataRequest';
import {
  PayWithOption,
  useConfirmationNavigationOptions,
} from '../../../hooks/useConfirmationNavigation';
import {
  isFinitePerpsTotal,
  usePerpsSubAccounts,
  type SubAccountInfo,
} from '../../../hooks/transactions/usePerpsSubAccounts';
import {
  AccountPickerRowContent,
  type AccountPickerTestIds,
} from '../account-picker-row';

export const PERPS_ACCOUNT_PICKER_TEST_IDS: AccountPickerTestIds = {
  row: 'perps-account-picker-row',
  pill: 'perps-account-picker-pill',
  name: 'perps-account-picker-name',
  arrow: 'perps-account-picker-arrow',
  sheet: 'perps-account-picker-sheet',
  searchInput: 'perps-account-picker-search',
  accountItem: 'perps-account-picker-item',
};

export const PERPS_ACCOUNT_BALANCE_SKELETON_TEST_ID =
  'perps-account-balance-skeleton';

/**
 * Renders Perps equity for the picker trailing column. Empty or non-numeric
 * `totalBalance` (HL `"--"`, `"NaN"`) means still loading — show a skeleton
 * instead of a fake `$0`.
 *
 * @param account - Perps sub-account whose `totalBalance` should be shown.
 * @returns Skeleton while loading, otherwise formatted fiat text.
 */
const formatBalance = (account: SubAccountInfo): React.ReactNode => {
  const raw = account.totalBalance ?? '';
  if (!isFinitePerpsTotal(raw)) {
    return (
      <Skeleton
        data-testid={PERPS_ACCOUNT_BALANCE_SKELETON_TEST_ID}
        height={20}
        width={64}
        className="rounded-md"
        aria-hidden
      />
    );
  }

  return (
    <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
      {formatPerpsFiat(Number.parseFloat(raw))}
    </Text>
  );
};

const PerpsAccountPickerRowContent = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const transactionMeta = useTransactionMetadataRequestOptional();
  const { subAccounts, selectedSubAccount } = usePerpsSubAccounts();

  const handleSelect = useCallback(
    (id: string) => {
      const transactionId = transactionMeta?.id;
      if (!transactionId) {
        return;
      }

      const from = transactionMeta?.txParams?.from ?? '';
      if (id.toLowerCase() === from.toLowerCase()) {
        return;
      }

      dispatch(
        updateEditableParams(transactionId, {
          from: id as Hex,
        }),
      ).catch((error: unknown) => {
        console.error('Failed to update perps deposit destination', error);
      });
    },
    [transactionMeta, dispatch],
  );

  return (
    <AccountPickerRowContent<SubAccountInfo>
      subAccounts={subAccounts}
      selectedSubAccount={selectedSubAccount}
      onSelect={handleSelect}
      formatBalance={formatBalance}
      title={t('selectPerpsAccount')}
      searchPlaceholder={t('searchAnAccount')}
      testIds={PERPS_ACCOUNT_PICKER_TEST_IDS}
    />
  );
};

/**
 * Destination perps-account picker shown on Money Account → Perps deposits.
 *
 * Lists EVM accounts with Perps balances (mirroring mobile
 * `PerpsAccountPickerRow`) and writes the selection to `txParams.from`.
 */
export function PerpsAccountPickerRow() {
  const { payWithOption } = useConfirmationNavigationOptions();
  const transactionMeta = useTransactionMetadataRequestOptional();

  const isMoneyAccountPerpsDeposit =
    payWithOption === PayWithOption.MoneyAccount &&
    hasTransactionType(transactionMeta, [TransactionType.perpsDeposit]);

  if (!isMoneyAccountPerpsDeposit) {
    return null;
  }

  return <PerpsAccountPickerRowContent />;
}
