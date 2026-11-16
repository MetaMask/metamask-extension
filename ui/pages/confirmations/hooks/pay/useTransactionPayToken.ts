import { useSelector } from 'react-redux';
import { useCallback } from 'react';
import type { CaipAssetType } from '@metamask/utils';
import type { TransactionMeta } from '@metamask/transaction-controller';
import type { TransactionPaymentToken } from '@metamask/transaction-pay-controller';
import { getNativeTokenAddress } from '@metamask/assets-controllers';
import { decodePaymentTokenAssetId } from '../../../../../shared/lib/transaction/pay-token';
import { useConfirmContext } from '../../context/confirm';
import {
  selectTransactionPaymentTokenByTransactionId,
  TransactionPayState,
} from '../../../../selectors/transactionPayController';
import { updateTransactionPaymentToken } from '../../../../store/controller-actions/transaction-pay-controller';

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

  const payTokenAsset = decodePaymentTokenAssetId(payToken);
  const isNative =
    payTokenAsset &&
    payTokenAsset.address === getNativeTokenAddress(payTokenAsset.chainId);

  const setPayToken = useCallback(
    async ({ assetId }: PayTokenSelection) => {
      await updateTransactionPaymentToken({
        transactionId: transactionId as string,
        assetId,
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
