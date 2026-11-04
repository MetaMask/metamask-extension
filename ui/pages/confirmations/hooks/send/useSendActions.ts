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
import { toast } from '../../../../components/ui/toast/toast';
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
      const genericErrorMessage = t('transactionError');

      // The Send loader replaces navigation history when the Snap
      // confirmation dialog opens, so the user cannot return to the previous page.
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
            : genericErrorMessage;
          captureSendFailed({
            chainIdCaip,
            snapId,
            failurePhase: NonEvmSendFailurePhase.Validation,
            errorCode: errorCode ?? NonEvmSendErrorCode.Unknown,
          });

          if (isRemainInSendScreen()) {
            updateNonEVMSubmitError(errorMessage);
          } else {
            // Show generic error message rather than error message from error code mapping
            toast.error(genericErrorMessage);
          }

          navigate(PREVIOUS_ROUTE);
          return;
        }

        // Success. The Snap owns the rest of the non-EVM transaction
        // lifecycle (Submitted/Finalized) and emits those itself.
        navigate(`${DEFAULT_ROUTE}?tab=activity`);
      } catch (error) {
        // Check for user rejection using error code (4001) - this is language-independent
        const { errorCode, failurePhase } = classifyNonEvmSendError(error);
        const isUserRejection = errorCode === NonEvmSendErrorCode.UserRejected;

        captureSendFailed({ chainIdCaip, snapId, failurePhase, errorCode });

        if (isUserRejection) {
          // User deliberately cancelled - clear error and navigate back silently
          updateNonEVMSubmitError(undefined);
        } else if (isRemainInSendScreen()) {
          // Actual snap/internal error - display error message to user
          updateNonEVMSubmitError(genericErrorMessage);
        } else {
          // Show generic error message rather than error message from error code mapping
          toast.error(genericErrorMessage);
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

/**
 * Returns whether the current route is still the send screen.
 *
 * The loader page replaces navigation history, so the user
 * cannot return to the previous page while the SNAP confirmation dialog is open.
 * Callers use this helper to decide whether an error can be shown on the send screen.
 *
 * @returns True when the current route is the send screen.
 */
function isRemainInSendScreen() {
  const pathname = window.location.hash.replace(/^#/u, '').split('?')[0];
  return pathname.startsWith(SEND_ROUTE);
}
