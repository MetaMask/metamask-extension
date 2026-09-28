import { CaipAssetType, Hex } from '@metamask/utils';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  CONFIRM_TRANSACTION_ROUTE,
  DEFAULT_ROUTE,
  PREVIOUS_ROUTE,
  SEND_ROUTE,
} from '../../../../helpers/constants/routes';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useInAppBack } from '../../../../hooks/useInAppBack';
import { setMaxValueMode } from '../../../../ducks/send-max-value/send-max-value';
import { SendPages } from '../../constants/send';
import { ConfirmationLoader } from '../useConfirmationNavigation';
import { sendMultichainTransactionForReview } from '../../utils/multichain-snaps';
import {
  addLeadingZeroIfNeeded,
  normalizeAmount,
  submitEvmTransaction,
} from '../../utils/send';
import { useSendContext } from '../../context/send';
import { useDispatch } from '../../../../store/hooks';
import { useSendType } from './useSendType';
import { mapSnapErrorCodeIntoTranslation } from './useAmountValidation';
import {
  classifyNonEvmSendError,
  isNonEvmSendUserRejection,
  NonEvmSendErrorCode,
  NonEvmSendFailurePhase,
  useNonEvmSendMetrics,
} from './metrics/useNonEvmSendMetrics';

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
  const handleBack = useInAppBack(DEFAULT_ROUTE);
  const { captureSendFailed } = useNonEvmSendMetrics();

  const handleSubmit = useCallback(async () => {
    if (!asset) {
      return;
    }
    const toAddress = to;

    // Clear any previous submit error
    updateNonEVMSubmitError(undefined);

    if (isEvmSendType) {
      const transactionPromise = dispatch(
        await submitEvmTransaction({
          asset,
          chainId: chainId as Hex,
          from: from as Hex,
          hexData: hexData as Hex,
          to: toAddress as Hex,
          value: normalizeAmount(value),
        }),
      );
      const params = new URLSearchParams();
      params.set('loader', ConfirmationLoader.Send);
      const route = `${CONFIRM_TRANSACTION_ROUTE}?${params.toString()}`;
      navigate(route);

      const transactionMeta = await transactionPromise;

      if (maxValueMode && transactionMeta) {
        dispatch(
          setMaxValueMode({
            transactionId: transactionMeta.id,
            enabled: true,
          }),
        );
      }
    } else {
      const chainIdCaip = chainId as string | undefined;
      const snapId = fromAccount?.metadata?.snap?.id;

      navigate(`${SEND_ROUTE}/${SendPages.LOADER}`);
      try {
        const result = (await sendMultichainTransactionForReview(
          fromAccount as InternalAccount,
          {
            fromAccountId: fromAccount?.id as string,
            toAddress: toAddress as string,
            assetId: asset.assetId as CaipAssetType,
            amount: addLeadingZeroIfNeeded(normalizeAmount(value)) as string,
          },
        )) as SnapConfirmSendResult;

        // Check if the snap returned a validation error
        if (result?.valid === false) {
          const errorCode = result?.errors?.[0]?.code;
          const errorMessage = errorCode
            ? mapSnapErrorCodeIntoTranslation(errorCode, t)
            : t('transactionError');
          captureSendFailed({
            chainIdCaip,
            snapId,
            failurePhase: NonEvmSendFailurePhase.Validation,
            errorCode: errorCode ?? NonEvmSendErrorCode.Unknown,
          });
          updateNonEVMSubmitError(errorMessage);
          navigate(PREVIOUS_ROUTE);
          return;
        }

        // Success. The Snap owns the rest of the non-EVM transaction
        // lifecycle (Submitted/Finalized) and emits those itself.
        navigate(`${DEFAULT_ROUTE}?tab=activity`);
      } catch (error) {
        // Check for user rejection using error code (4001) - this is language-independent
        const { errorCode, failurePhase } = classifyNonEvmSendError(error);

        captureSendFailed({ chainIdCaip, snapId, failurePhase, errorCode });

        if (isNonEvmSendUserRejection(error)) {
          // User deliberately cancelled - clear error and navigate back silently
          updateNonEVMSubmitError(undefined);
        } else {
          // Actual snap/internal error - display error message to user
          updateNonEVMSubmitError(t('transactionError'));
        }
        navigate(PREVIOUS_ROUTE);
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
    captureSendFailed,
  ]);

  const handleCancel = useCallback(() => {
    navigate(DEFAULT_ROUTE);
  }, [navigate]);

  return { handleSubmit, handleCancel, handleBack };
};
