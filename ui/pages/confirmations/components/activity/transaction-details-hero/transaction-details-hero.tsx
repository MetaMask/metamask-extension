import React, { useMemo } from 'react';
import { Box, BoxAlignItems } from '@metamask/design-system-react';
import { Text } from '../../../../../components/component-library';
import { TextVariant } from '../../../../../helpers/constants/design-system';
import { useFiatFormatter } from '../../../../../hooks/useFiatFormatter';
import { useTransactionDetails } from '../transaction-details-context';

// eslint-disable-next-line @typescript-eslint/naming-convention
export function TransactionDetailsHero() {
  const { transactionMeta } = useTransactionDetails();
  const fiatFormatter = useFiatFormatter({ overrideCurrency: 'usd' });

  const { metamaskPay } = transactionMeta;
  const { targetFiat } = metamaskPay || {};

  const formattedAmount = useMemo(() => {
    if (!targetFiat || targetFiat === '0') {
      return null;
    }
    return fiatFormatter(Number(targetFiat));
  }, [fiatFormatter, targetFiat]);

  if (!formattedAmount) {
    return null;
  }

  return (
    <Box
      className="flex"
      alignItems={BoxAlignItems.Center}
      style={{ justifyContent: 'center' }}
      paddingTop={4}
      paddingBottom={4}
      data-testid="transaction-details-hero"
    >
      <Text variant={TextVariant.displayMd}>{formattedAmount}</Text>
    </Box>
  );
}
