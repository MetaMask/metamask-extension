import { CaipAssetType, Hex } from '@metamask/utils';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom-v5-compat';

import {
  CONFIRM_TRANSACTION_ROUTE,
  DEFAULT_ROUTE,
  PREVIOUS_ROUTE,
  SEND_ROUTE,
} from '../../../../helpers/constants/routes';
import { setDefaultHomeActiveTabName } from '../../../../store/actions';
import { SendPages } from '../../constants/send';
import { sendMultichainTransactionForReview } from '../../utils/multichain-snaps';
import { addLeadingZeroIfNeeded, submitEvmTransaction } from '../../utils/send';
import { useSendContext } from '../../context/send';
import { useSendType } from './useSendType';

export const useSendActions = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    asset,
    chainId,
    from,
    fromAccount,
    hexData,
    maxValueMode,
    toResolved: to,
    value,
  } = useSendContext();
  const { isEvmSendType } = useSendType();

  const handleSubmit = useCallback(async () => {
    if (!asset) {
      return;
    }
    const toAddress = to;
    if (isEvmSendType) {
      dispatch(
        await submitEvmTransaction({
          asset,
          chainId: chainId as Hex,
          from: from as Hex,
          hexData: hexData as Hex,
          to: toAddress as Hex,
          value: value as string,
        }),
      );
      const route = maxValueMode
        ? `${CONFIRM_TRANSACTION_ROUTE}?maxValueMode=${maxValueMode}`
        : CONFIRM_TRANSACTION_ROUTE;
      navigate(route);
    } else {
      navigate(`${SEND_ROUTE}/${SendPages.LOADER}`);
      await dispatch(setDefaultHomeActiveTabName('activity'));
      try {
        await sendMultichainTransactionForReview(
          fromAccount as InternalAccount,
          {
            fromAccountId: fromAccount?.id as string,
            toAddress: toAddress as string,
            assetId: asset.assetId as CaipAssetType,
            amount: addLeadingZeroIfNeeded(value || ('0' as string)) as string,
          },
        );
        navigate(DEFAULT_ROUTE);
      } catch (error) {
        // intentional empty catch
      }
    }
  }, [
    asset,
    chainId,
    dispatch,
    from,
    fromAccount,
    hexData,
    navigate,
    isEvmSendType,
    maxValueMode,
    to,
    value,
  ]);

  const handleBack = useCallback(() => {
    navigate(PREVIOUS_ROUTE);
  }, [navigate]);

  const handleCancel = useCallback(() => {
    navigate(DEFAULT_ROUTE);
  }, [navigate]);

  return { handleSubmit, handleCancel, handleBack };
};
