import { useSelector } from 'react-redux';
import { useCallback } from 'react';
import { parseCaipAssetType } from '@metamask/utils';
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
import type { SetNonEvmPayTokenRequest, SetPayTokenRequest } from './types';

export function useTransactionPayToken(): {
  isNative?: boolean;
  payToken: TransactionPaymentToken | undefined;
  setPayToken: (
    newPayToken: SetPayTokenRequest | SetNonEvmPayTokenRequest,
  ) => Promise<void>;
} {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const transactionId = currentConfirmation?.id ?? '';

  const payToken = useSelector((state: TransactionPayState) =>
    selectTransactionPaymentTokenByTransactionId(state, transactionId),
  );

  const isNative = payToken && isNativePaymentToken(payToken);

  const setPayToken = useCallback(
    async (newPayToken: SetPayTokenRequest | SetNonEvmPayTokenRequest) => {
      await updateTransactionPaymentToken({
        transactionId,
        assetId:
          'assetId' in newPayToken
            ? newPayToken.assetId
            : getEvmAssetId(newPayToken.address, newPayToken.chainId),
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

function isNativePaymentToken(payToken: TransactionPaymentToken): boolean {
  const evmPayToken = getEvmPaymentToken(payToken);

  if (!evmPayToken) {
    return parseCaipAssetType(payToken.assetId).assetNamespace === 'slip44';
  }

  return evmPayToken.address === getNativeTokenAddress(evmPayToken.chainId);
}
