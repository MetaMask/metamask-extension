import { CaipAssetType, Hex } from '@metamask/utils';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { toHex } from '@metamask/controller-utils';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';

import {
  CONFIRM_TRANSACTION_ROUTE,
  DEFAULT_ROUTE,
  SEND_ROUTE,
} from '../../../../helpers/constants/routes';
import { SendPages } from '../../constants/send';
import { sendMultichainTransactionForReview } from '../../utils/multichain-snaps';
import { submitEvmTransaction } from '../../utils/send';
import { useSendContext } from '../../context/send';
import { useSendType } from './useSendType';

export const useSendActions = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const { asset, chainId, from, fromAccount, to, value } = useSendContext();
  const { isEvmSendType } = useSendType();

  const handleSubmit = useCallback(
    async (recipientAddress?: string) => {
      if (!asset) {
        return;
      }
      const toAddress = recipientAddress || to;

      if (isEvmSendType) {
        dispatch(
          await submitEvmTransaction({
            asset,
            chainId: chainId as Hex,
            from: from as Hex,
            to: toAddress as Hex,
            value: value as string,
          }),
        );
        history.push(CONFIRM_TRANSACTION_ROUTE);
      } else {
        history.push(`${SEND_ROUTE}/${SendPages.LOADER}`);
        await sendMultichainTransactionForReview(
          fromAccount as InternalAccount,
          {
            fromAccountId: fromAccount?.id as string,
            toAddress: toAddress as string,
            assetId: asset.address as CaipAssetType,
            amount: value as string,
          },
        );
      }
    },
    [
      asset,
      chainId,
      dispatch,
      from,
      fromAccount,
      history,
      isEvmSendType,
      to,
      value,
    ],
  );

  const handleBack = useCallback(() => {
    history.goBack();
  }, [history]);

  const handleCancel = useCallback(() => {
    history.push(DEFAULT_ROUTE);
  }, [history]);

  return { handleSubmit, handleCancel, handleBack };
};
