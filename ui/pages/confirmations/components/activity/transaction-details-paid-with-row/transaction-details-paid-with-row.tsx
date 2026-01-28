import React from 'react';
import { useSelector } from 'react-redux';
import { Hex } from '@metamask/utils';
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
import { getTokenByAccountAndAddressAndChainId } from '../../../../../selectors/assets';
import { TokenIcon } from '../../token-icon';

// eslint-disable-next-line @typescript-eslint/naming-convention
export function TransactionDetailsPaidWithRow() {
  const t = useI18nContext();
  const { transactionMeta } = useTransactionDetails();

  const { metamaskPay } = transactionMeta;
  const { chainId, tokenAddress } = metamaskPay || {};

  const token = useSelector((state) =>
    tokenAddress && chainId
      ? getTokenByAccountAndAddressAndChainId(
          state,
          undefined,
          tokenAddress as Hex,
          chainId as Hex,
        )
      : null,
  );

  if (!chainId || !tokenAddress || !token) {
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
