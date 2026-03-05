import type { TransactionMeta } from '@metamask/transaction-controller';
import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Box } from '../../../../../../components/component-library';
import {
  Display,
  FlexDirection,
} from '../../../../../../helpers/constants/design-system';
import { ConfirmInfoRowSize } from '../../../../../../components/app/confirm/info/row/row';
import {
  selectTransactionPaymentTokenByTransactionId,
  type TransactionPayState,
} from '../../../../../../selectors/transactionPayController';
import { useConfirmContext } from '../../../../context/confirm';
import { CustomAmountInfo } from '../../../info/custom-amount-info';
import { useTransactionCustomAmountAlerts } from '../../../../hooks/transactions/useTransactionCustomAmountAlerts';
import {
  useIsTransactionPayLoading,
  useTransactionPayQuotes,
} from '../../../../hooks/pay/useTransactionPayData';
import { BridgeFeeRow } from '../../../rows/bridge-fee-row/bridge-fee-row';
import { ClaimableBonusRow } from '../../../rows/claimable-bonus-row/claimable-bonus-row';
import { TotalRow } from '../../../rows/total-row/total-row';
import { MusdOverrideContent } from './musd-override-content';

const MusdBottomContent = () => {
  const quotes = useTransactionPayQuotes();
  const isQuotesLoading = useIsTransactionPayLoading();
  const { hideResults } = useTransactionCustomAmountAlerts();

  const isResultReady = isQuotesLoading || Boolean(quotes?.length);

  if (!isResultReady || hideResults) {
    return null;
  }

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      gap={2}
      paddingBottom={4}
    >
      <BridgeFeeRow variant={ConfirmInfoRowSize.Small} />
      <ClaimableBonusRow rowVariant={ConfirmInfoRowSize.Small} />
      <TotalRow variant={ConfirmInfoRowSize.Small} />
    </Box>
  );
};

/**
 * MusdConversionInfo Component
 *
 * The main info component for mUSD conversion confirmations.
 * Displays the amount input interface for conversion with custom override content
 * that shows the expected mUSD output amount.
 *
 * The heading with "Convert and get 3%" and info tooltip is rendered
 * by the MusdConversionHeader in the confirmation header area.
 *
 * Token filtering is handled by the PayWithModal component which detects
 * mUSD conversion transactions and applies the appropriate filter.
 *
 * The preferred payment token is read from TransactionPayController's persisted
 * state, which survives extension popup restarts.
 */
export const MusdConversionInfo = () => {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const transactionId = currentConfirmation?.id ?? '';

  const existingPayToken = useSelector((state: TransactionPayState) =>
    selectTransactionPaymentTokenByTransactionId(state, transactionId),
  );

  const preferredToken = existingPayToken
    ? { address: existingPayToken.address, chainId: existingPayToken.chainId }
    : undefined;

  const renderOverrideContent = useCallback(
    (amountHuman: string) => <MusdOverrideContent amountHuman={amountHuman} />,
    [],
  );

  return (
    <CustomAmountInfo
      disablePay={Boolean(existingPayToken)}
      preferredToken={preferredToken}
      overrideCenterContent={renderOverrideContent}
      overrideBottomContent={<MusdBottomContent />}
    />
  );
};
