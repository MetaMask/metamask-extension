import { Hex } from '@metamask/utils';
import { toHex } from '@metamask/controller-utils';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';

import {
  CONFIRM_TRANSACTION_ROUTE,
  DEFAULT_ROUTE,
} from '../../../../helpers/constants/routes';
import { submitEvmTransaction } from '../../utils/send';
import { useSendContext } from '../../context/send';
import { useSendType } from './useSendType';

export const useSendActions = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const { asset, fromAccount, from, to, value } = useSendContext();
  const { isEvmSendType } = useSendType();

  const handleSubmit = useCallback(
    async (recipientAddress?: string) => {
      if (!asset?.chainId) {
        return;
      }

      const toAddress = recipientAddress || to;

      if (isEvmSendType) {
        await dispatch(
          await submitEvmTransaction({
            asset,
            chainId: toHex(asset.chainId),
            from: from as Hex,
            to: toAddress as Hex,
            value: value as string,
          }),
        );
        history.push(CONFIRM_TRANSACTION_ROUTE);
      }
    },
    [asset, from, isEvmSendType, to, value],
  );

  const handleBack = useCallback(() => {
    history.goBack();
  }, [history]);

  const handleCancel = useCallback(() => {
    history.push(DEFAULT_ROUTE);
  }, [history]);

  return { handleSubmit, handleCancel, handleBack };
};
