import React, { useMemo } from 'react';
import { TransactionType } from '@metamask/transaction-controller';
import { MUSD_DECIMALS, MUSD_TOKEN } from '@metamask/money-account-utils';
import { BigNumber } from 'bignumber.js';
import { Text, Box } from '../../../../../components/component-library';
import {
  Display,
  AlignItems,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { useFiatFormatter } from '../../../../../hooks/useFiatFormatter';
import { parseStandardTokenTransactionData } from '../../../../../../shared/lib/transaction.utils';
import { hasTransactionType } from '../../../../../../shared/lib/transactions.utils';
import { useTransactionDetails } from '../transaction-details-context';

function getWithdrawTransferAmountHuman(transactionMeta: {
  nestedTransactions?: { data?: string; type?: string }[];
}): string | undefined {
  const transfer = transactionMeta.nestedTransactions?.find(
    (nested) => nested.type === TransactionType.tokenMethodTransfer,
  );
  if (!transfer?.data) {
    return undefined;
  }
  const parsed = parseStandardTokenTransactionData(transfer.data);
  const value = parsed?.args?._value ?? parsed?.args?.value;
  if (value === undefined || value === null) {
    return undefined;
  }
  const amount = new BigNumber(value.toString()).dividedBy(
    new BigNumber(10).pow(MUSD_DECIMALS),
  );
  if (amount.isZero()) {
    return undefined;
  }
  return `${amount.toFixed()} ${MUSD_TOKEN.symbol}`;
}

export function TransactionDetailsHero() {
  const { transactionMeta } = useTransactionDetails();
  const fiatFormatter = useFiatFormatter({ overrideCurrency: 'usd' });

  const { metamaskPay } = transactionMeta;
  const { targetFiat } = metamaskPay || {};
  const isMoneyAccountWithdraw = hasTransactionType(transactionMeta, [
    TransactionType.moneyAccountWithdraw,
  ]);

  const formattedAmount = useMemo(() => {
    if (targetFiat && targetFiat !== '0') {
      return fiatFormatter(Number(targetFiat));
    }
    // Direct withdraws have no quotes, so targetFiat stays 0. Show the
    // nested transfer amount instead of an empty / $0 hero.
    if (isMoneyAccountWithdraw) {
      return getWithdrawTransferAmountHuman(transactionMeta);
    }
    return null;
  }, [fiatFormatter, isMoneyAccountWithdraw, targetFiat, transactionMeta]);

  if (!formattedAmount) {
    return null;
  }

  return (
    <Box
      display={Display.Flex}
      alignItems={AlignItems.center}
      style={{ justifyContent: 'center' }}
      paddingTop={4}
      paddingBottom={4}
      data-testid="transaction-details-hero"
    >
      <Text variant={TextVariant.displayMd}>{formattedAmount}</Text>
    </Box>
  );
}
