///: BEGIN:ONLY_INCLUDE_IF(musd-conversion)
import React, { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { useAddToken } from '../../../hooks/tokens/useAddToken';
import { CustomAmountInfo } from '../custom-amount-info';
import { useConfirmContext } from '../../../context/confirm';
import { selectSelectedPaymentToken } from '../../../../../ducks/musd/selectors';
import {
  MUSD_TOKEN,
  MUSD_TOKEN_ADDRESS,
  MUSD_CONVERSION_DEFAULT_CHAIN_ID,
} from '../../../../../../shared/constants/musd';
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
 */
export const MusdConversionInfo = () => {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const chainId =
    currentConfirmation?.chainId ?? MUSD_CONVERSION_DEFAULT_CHAIN_ID;
  const selectedPaymentToken = useSelector(selectSelectedPaymentToken);

  // Auto-add mUSD token to user's wallet
  useAddToken({
    chainId,
    decimals: MUSD_TOKEN.decimals,
    symbol: MUSD_TOKEN.symbol,
    tokenAddress: MUSD_TOKEN_ADDRESS,
  });

  // Use the stablecoin the user chose (e.g. USDC), not mUSD.
  // Falls back to undefined so useAutomaticTransactionPayToken picks the
  // first available token with balance.
  const preferredToken = useMemo(
    () =>
      selectedPaymentToken
        ? {
            address: selectedPaymentToken.address,
            chainId: selectedPaymentToken.chainId,
          }
        : undefined,
    [selectedPaymentToken],
  );

  // Render override content for mUSD conversion - shows output amount tag
  const renderOverrideContent = useCallback(
    (amountHuman: string) => <MusdOverrideContent amountHuman={amountHuman} />,
    [],
  );

  return (
    <CustomAmountInfo
      hasMax
      preferredToken={preferredToken}
      overrideContent={renderOverrideContent}
    />
  );
};
///: END:ONLY_INCLUDE_IF
