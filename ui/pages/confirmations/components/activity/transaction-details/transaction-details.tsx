import React from 'react';
import { TransactionType } from '@metamask/transaction-controller';
import { Box } from '../../../../../components/component-library';
import {
  Display,
  FlexDirection,
} from '../../../../../helpers/constants/design-system';
import { ConfirmInfoRowDivider } from '../../../../../components/app/confirm/info/row';
import { TransactionDetailsHero } from '../transaction-details-hero';
import { TransactionDetailsStatusRow } from '../transaction-details-status-row';
import { TransactionDetailsDateRow } from '../transaction-details-date-row';
import { TransactionDetailsAccountRow } from '../transaction-details-account-row';
import { TransactionDetailsPaidWithRow } from '../transaction-details-paid-with-row';
import { TransactionDetailsNetworkFeeRow } from '../transaction-details-network-fee-row';
import { TransactionDetailsBridgeFeeRow } from '../transaction-details-bridge-fee-row';
import { TransactionDetailsTotalRow } from '../transaction-details-total-row';
import { TransactionDetailsSummary } from '../transaction-details-summary';
import { useTransactionDetails } from '../transaction-details-context';
import { hasTransactionType } from '../../../../../../shared/lib/transactions.utils';

// eslint-disable-next-line @typescript-eslint/naming-convention
export function TransactionDetails() {
  const { transactionMeta } = useTransactionDetails();
  const hasPaymentDetails = Boolean(transactionMeta.metamaskPay);
  // Summary is hidden for Perps Withdraw post-MVP; a tailored summary can
  // replace the generic one later.
  const hideSummary = hasTransactionType(transactionMeta, [
    TransactionType.perpsWithdraw,
  ]);

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      data-testid="transaction-details"
    >
      <TransactionDetailsHero />

      <ConfirmInfoRowDivider />

      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        gap={3}
        paddingTop={2}
        paddingBottom={2}
      >
        <TransactionDetailsStatusRow />
        <TransactionDetailsDateRow />
        <TransactionDetailsAccountRow />
      </Box>

      {hasPaymentDetails && (
        <>
          <ConfirmInfoRowDivider />

          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            gap={3}
            paddingTop={2}
            paddingBottom={2}
          >
            <TransactionDetailsPaidWithRow />
            <TransactionDetailsNetworkFeeRow />
            <TransactionDetailsBridgeFeeRow />
            <TransactionDetailsTotalRow />
          </Box>
        </>
      )}

      {!hideSummary && (
        <>
          <ConfirmInfoRowDivider />

          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            gap={3}
            paddingTop={2}
            paddingBottom={2}
          >
            <TransactionDetailsSummary />
          </Box>
        </>
      )}
    </Box>
  );
}
