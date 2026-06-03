import React from 'react';
import { Hex } from '@metamask/utils';
import { TransactionType } from '@metamask/transaction-controller';
import { Text, Box } from '../../../../../components/component-library';
import {
  Display,
  FlexDirection,
  AlignItems,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { TransactionDetailsRow } from '../transaction-details-row';
import { useTransactionDetails } from '../transaction-details-context';
import { useTokenWithBalance } from '../../../hooks/tokens/useTokenWithBalance';
import { TokenIcon } from '../../token-icon';
import { hasTransactionType } from '../../../../../../shared/lib/transactions.utils';

// eslint-disable-next-line @typescript-eslint/naming-convention
export function TransactionDetailsPaidWithRow() {
  const t = useI18nContext();
  const { transactionMeta } = useTransactionDetails();

  const { metamaskPay } = transactionMeta;
  const { chainId, tokenAddress } = metamaskPay || {};

  const token = useTokenWithBalance(
    (tokenAddress ?? '0x0') as Hex,
    (chainId ?? '0x0') as Hex,
  );

  if (!chainId || !tokenAddress || !token) {
    return null;
  }

  const isWithdraw = hasTransactionType(transactionMeta, [
    TransactionType.perpsWithdraw,
  ]);
  const label = isWithdraw ? t('receiveToken') : t('paidWith');

  return (
    <TransactionDetailsRow
      label={label}
      data-testid="transaction-details-paid-with-row"
    >
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        alignItems={AlignItems.center}
        gap={2}
      >
        <TokenIcon
          chainId={chainId as Hex}
          tokenAddress={tokenAddress as Hex}
          size="sm"
        />
        <Text variant={TextVariant.bodyMd}>{token.symbol}</Text>
      </Box>
    </TransactionDetailsRow>
  );
}
