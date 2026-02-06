import { CaipAssetType, Hex } from '@metamask/utils';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { errorCodes } from '@metamask/rpc-errors';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import {
  CONFIRM_TRANSACTION_ROUTE,
  DEFAULT_ROUTE,
  PREVIOUS_ROUTE,
  SEND_ROUTE,
} from '../../../../helpers/constants/routes';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { SendPages } from '../../constants/send';
import { sendMultichainTransactionForReview } from '../../utils/multichain-snaps';
import { addLeadingZeroIfNeeded, submitEvmTransaction } from '../../utils/send';
import { useSendContext } from '../../context/send';
import { useSendType } from './useSendType';
import { mapSnapErrorCodeIntoTranslation } from './useAmountValidation';

type SnapConfirmSendResult = {
  valid?: boolean;
  errors?: { code: string }[];
  transactionId?: string;
};

export const useSendActions = () => {
  const t = useI18nContext();
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
    updateNonEVMSubmitError,
    value,
  } = useSendContext();
  const { isEvmSendType } = useSendType();

  const handleSubmit = useCallback(async () => {
    if (!asset) {
      return;
    }
    const toAddress = to;

    // Clear any previous submit error
    updateNonEVMSubmitError(undefined);

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
      try {
        const result = (await sendMultichainTransactionForReview(
          fromAccount as InternalAccount,
          {
            fromAccountId: fromAccount?.id as string,
            toAddress: toAddress as string,
            assetId: asset.assetId as CaipAssetType,
            amount: addLeadingZeroIfNeeded(value || ('0' as string)) as string,
          },
        )) as SnapConfirmSendResult;

        // Check if the snap returned a validation error
        if (result?.valid === false) {
          const errorMessage = result?.errors?.length
            ? mapSnapErrorCodeIntoTranslation(result.errors[0].code, t)
            : t('transactionError');
          updateNonEVMSubmitError(errorMessage);
          navigate(-1);
          return;
        }

        // Success - navigate to activity tab
        navigate(`${DEFAULT_ROUTE}?tab=activity`);
      } catch (error) {
        // Check for user rejection using error code (4001) - this is language-independent
        const errorCode = (error as { code?: number })?.code;
        const isUserRejection =
          errorCode === errorCodes.provider.userRejectedRequest;

        if (isUserRejection) {
          // User deliberately cancelled - clear error and navigate back silently
          updateNonEVMSubmitError(undefined);
        } else {
          // Actual snap/internal error - display error message to user
          updateNonEVMSubmitError(t('transactionError'));
        }
        navigate(-1);
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
    t,
    to,
    updateNonEVMSubmitError,
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
