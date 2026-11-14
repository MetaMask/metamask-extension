import { useSelector } from 'react-redux';
import { useCallback } from 'react';
import type { Hex } from '@metamask/utils';
import type { TransactionMeta } from '@metamask/transaction-controller';
import type { TransactionPaymentToken } from '@metamask/transaction-pay-controller';
import { getNativeTokenAddress } from '@metamask/assets-controllers';
import {
  getEvmAssetId,
  getEvmPaymentToken,
} from '../../../../../shared/lib/transaction/pay-token';
import { useConfirmContext } from '../../context/confirm';
import {
  selectTransactionPaymentTokenByTransactionId,
  TransactionPayState,
} from '../../../../selectors/transactionPayController';
import { updateTransactionPaymentToken } from '../../../../store/controller-actions/transaction-pay-controller';

export function useTransactionPayToken(): {
  isNative?: boolean;
  payToken: TransactionPaymentToken | undefined;
  setPayToken: (newPayToken: { address: Hex; chainId: Hex }) => Promise<void>;
} {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const transactionId = currentConfirmation?.id ?? '';

  const payToken = useSelector((state: TransactionPayState) =>
    selectTransactionPaymentTokenByTransactionId(state, transactionId),
  );

  const evmPayToken = getEvmPaymentToken(payToken);
  const isNative =
    evmPayToken &&
    evmPayToken.address === getNativeTokenAddress(evmPayToken.chainId);

  const setPayToken = useCallback(
    async (newPayToken: { address: Hex; chainId: Hex }) => {
      await updateTransactionPaymentToken({
        transactionId: transactionId as string,
        assetId: getEvmAssetId(newPayToken.address, newPayToken.chainId),
      });
    },
    [transactionId],
  );

  return {
    isNative,
    payToken,
    setPayToken,
  };
}
