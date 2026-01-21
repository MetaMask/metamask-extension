import React, { useMemo } from 'react';
import { Text, Box } from '../../../../../components/component-library';
import {
  Display,
  FlexDirection,
  AlignItems,
  JustifyContent,
  TextVariant,
  BorderRadius,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { TransactionDetailsRow } from '../transaction-details-row';
import { useTransactionDetails } from '../transaction-details-context';
import { ARBITRUM_USDC, POLYGON_USDCE } from '../constants';

function getTokenSymbol(
  chainId: string | undefined,
  tokenAddress: string | undefined,
): string | undefined {
  if (!chainId || !tokenAddress) {
    return undefined;
  }

  const normalizedAddress = tokenAddress.toLowerCase();

  if (normalizedAddress === ARBITRUM_USDC.address.toLowerCase()) {
    return ARBITRUM_USDC.symbol;
  }

  if (normalizedAddress === POLYGON_USDCE.address.toLowerCase()) {
    return POLYGON_USDCE.symbol;
  }

  return undefined;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export function TransactionDetailsPaidWithRow() {
  const t = useI18nContext();
  const { transactionMeta } = useTransactionDetails();

  const { metamaskPay } = transactionMeta;
  const { chainId, tokenAddress } = metamaskPay || {};

  const tokenSymbol = useMemo(
    () => getTokenSymbol(chainId, tokenAddress),
    [chainId, tokenAddress],
  );

  if (!chainId || !tokenAddress || !tokenSymbol) {
    return null;
  }

  return (
    <TransactionDetailsRow
      label={t('paidWith')}
      data-testid="transaction-details-paid-with-row"
    >
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        alignItems={AlignItems.center}
        gap={2}
      >
        <Box
          display={Display.Flex}
          alignItems={AlignItems.center}
          justifyContent={JustifyContent.center}
          style={{
            width: '16px',
            height: '16px',
            minWidth: '16px',
          }}
          borderRadius={BorderRadius.full}
          as="img"
          src="./images/usdc-logo.svg"
          alt={tokenSymbol}
        />
        <Text variant={TextVariant.bodyMd}>{tokenSymbol}</Text>
      </Box>
    </TransactionDetailsRow>
  );
}
