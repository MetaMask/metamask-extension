import { useSelector } from 'react-redux';
import { useCallback } from 'react';
import { parseCaipAssetType, type CaipAssetType } from '@metamask/utils';
import {
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import {
  PaymentOverride,
  type TransactionPaymentToken,
} from '@metamask/transaction-pay-controller';
import { getNativeTokenAddress } from '@metamask/assets-controllers';
import {
  decodeEvmAssetId,
  decodePaymentTokenAssetId,
} from '../../../../../shared/lib/transaction/pay-token';
import { hasTransactionType } from '../../../../../shared/lib/transactions.utils';
import { useConfirmContext } from '../../context/confirm';
import {
  selectTransactionPaymentTokenByTransactionId,
  TransactionPayState,
} from '../../../../selectors/transactionPayController';
import {
  setPaymentOverride,
  updateTransactionPaymentToken,
} from '../../../../store/controller-actions/transaction-pay-controller';

/** Payment token selection, identified by its CAIP-19 asset ID. */
export type PayTokenSelection = {
  assetId: CaipAssetType;
};

export function useTransactionPayToken(): {
  isNative?: boolean;
  payToken: TransactionPaymentToken | undefined;
  setPayToken: (selection: PayTokenSelection) => Promise<void>;
} {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const transactionId = currentConfirmation?.id ?? '';

  const payToken = useSelector((state: TransactionPayState) =>
    selectTransactionPaymentTokenByTransactionId(state, transactionId),
  );

  const isNative = payToken && isNativePaymentToken(payToken);

  const isMoneyAccountDeposit = hasTransactionType(currentConfirmation, [
    TransactionType.moneyAccountDeposit,
  ]);

  // The current token is non-EVM when it is selected but has no EVM chain.
  const isNonEvmPayTokenSelected =
    Boolean(payToken) && !decodePaymentTokenAssetId(payToken);

  const setPayToken = useCallback(
    async ({ assetId }: PayTokenSelection) => {
      const isNonEvmSource = !decodeEvmAssetId(assetId);

      // Switching to or from a non-EVM source on a Money Account deposit
      // reconfigures its vault second leg before the first quote.
      if (
        isMoneyAccountDeposit &&
        (isNonEvmSource || isNonEvmPayTokenSelected)
      ) {
        await setMoneyAccountDepositNonEvmSource(transactionId, isNonEvmSource);
      }

      await updateTransactionPaymentToken({
        transactionId,
        assetId,
      });
    },
    [isMoneyAccountDeposit, isNonEvmPayTokenSelected, transactionId],
  );

  return {
    isNative,
    payToken,
    setPayToken,
  };
}

/**
 * Configures a Money Account deposit for a non-EVM source, or clears that
 * configuration when switching back to an EVM token.
 *
 * Core cannot embed the vault calls in a quote from a non-EVM source, so it
 * bridges to the Money Account and runs the vault deposit as a non-atomic
 * second leg. It only does that for a request with the Money Account override
 * and `atomic: false`.
 *
 * @param transactionId - ID of the Money Account deposit.
 * @param isNonEvmSource - Whether the newly selected payment token is non-EVM.
 */
async function setMoneyAccountDepositNonEvmSource(
  transactionId: string,
  isNonEvmSource: boolean,
): Promise<void> {
  await setPaymentOverride(
    transactionId,
    isNonEvmSource
      ? { atomic: false, paymentOverride: PaymentOverride.MoneyAccount }
      : { paymentOverride: undefined },
  );
}

function isNativePaymentToken(payToken: TransactionPaymentToken): boolean {
  const payTokenAsset = decodePaymentTokenAssetId(payToken);

  if (!payTokenAsset) {
    return parseCaipAssetType(payToken.assetId).assetNamespace === 'slip44';
  }

  return payTokenAsset.address === getNativeTokenAddress(payTokenAsset.chainId);
}
