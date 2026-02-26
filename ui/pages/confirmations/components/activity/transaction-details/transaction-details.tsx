import React from 'react';
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

// eslint-disable-next-line @typescript-eslint/naming-convention
export function TransactionDetails() {
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
    </Box>
  );
}
