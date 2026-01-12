import { useSelector } from 'react-redux';
import { useCallback } from 'react';
import type { Hex } from '@metamask/utils';
import type { TransactionMeta } from '@metamask/transaction-controller';
import type { TransactionPaymentToken } from '@metamask/transaction-pay-controller';
import { useConfirmContext } from '../../context/confirm';
import {
  selectTransactionPaymentTokenByTransactionId,
  TransactionPayState,
} from '../../../../selectors/transactionPayController';
import { updateTransactionPaymentToken } from '../../../../store/controller-actions/transaction-pay-controller';
import { getNativeTokenAddress } from '../../utils/transaction-pay';

export function useTransactionPayToken(): {
  isNative?: boolean;
  payToken: TransactionPaymentToken | undefined;
  setPayToken: (newPayToken: { address: Hex; chainId: Hex }) => void;
} {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const transactionId = currentConfirmation?.id ?? '';

  const payToken = useSelector((state: TransactionPayState) =>
    selectTransactionPaymentTokenByTransactionId(state, transactionId),
  );

  const isNative =
    payToken && payToken?.address === getNativeTokenAddress(payToken?.chainId);

  const setPayToken = useCallback(
    (newPayToken: { address: Hex; chainId: Hex }) => {
      try {
        updateTransactionPaymentToken({
          transactionId: transactionId as string,
          tokenAddress: newPayToken.address,
          chainId: newPayToken.chainId,
        });
      } catch (e) {
        console.error('Error updating payment token', e);
      }
    },
    [transactionId],
  );

  return {
    isNative,
    payToken,
    setPayToken,
  };
}
