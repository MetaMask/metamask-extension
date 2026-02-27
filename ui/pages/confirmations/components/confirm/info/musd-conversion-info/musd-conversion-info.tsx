import type { TransactionMeta } from '@metamask/transaction-controller';
import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  selectTransactionPaymentTokenByTransactionId,
  type TransactionPayState,
} from '../../../../../../selectors/transactionPayController';
import { useConfirmContext } from '../../../../context/confirm';
import { CustomAmountInfo } from '../../../info/custom-amount-info';
import { MusdOverrideContent } from './musd-override-content';

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
      overrideContent={renderOverrideContent}
    />
  );
};
