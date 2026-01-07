import { TransactionMeta } from '@metamask/transaction-controller';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { RetryStrategy } from '@metamask/keyring-utils';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import {
  resolvePendingApproval,
  closeCurrentNotificationWindow,
  setHardwareSigningState,
} from '../../../store/actions';
import { isAddressLedger } from '../../../ducks/metamask/metamask';
import { useConfirmContext } from '../context/confirm';
import { isCorrectDeveloperTransactionType } from '../../../../shared/lib/confirmation.utils';
import { getConfirmationSender } from '../components/confirm/utils';
import { useConfirmationNavigation } from './useConfirmationNavigation';
import { useTransactionConfirm } from './transactions/useTransactionConfirm';
import {
  useAddEthereumChain,
  isAddEthereumChainType,
} from './useAddEthereumChain';
import { useDappSwapActions } from './transactions/dapp-swap-comparison/useDappSwapActions';

type SubmissionResult = {
  success: boolean;
  retryable: boolean;
  error?: Error;
};

type SubmissionStrategy = 'transaction' | 'add-ethereum-chain' | 'approval';

export const useConfirmationSubmit = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { navigateNext } = useConfirmationNavigation();
  const { onDappSwapCompleted } = useDappSwapActions();

  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { onTransactionConfirm } = useTransactionConfirm();
  const { onSubmit: onAddEthereumChain } = useAddEthereumChain();

  const { from } = getConfirmationSender(currentConfirmation);
  const isLedgerAccount = useSelector(
    (state) => from && isAddressLedger(state, from),
  );

  const getStrategy = useCallback((): SubmissionStrategy => {
    if (isAddEthereumChainType(currentConfirmation)) {
      return 'add-ethereum-chain';
    }

    if (isCorrectDeveloperTransactionType(currentConfirmation?.type)) {
      return 'transaction';
    }

    return 'approval';
  }, [currentConfirmation]);

  const submitTransaction = useCallback(async (): Promise<SubmissionResult> => {
    try {
      await onTransactionConfirm();
      return { success: true, retryable: false };
    } catch (error) {
      return {
        success: false,
        retryable: true,
        error: error as Error,
      };
    }
  }, [onTransactionConfirm]);

  const submitAddEthereumChain =
    useCallback(async (): Promise<SubmissionResult> => {
      try {
        await onAddEthereumChain();
        navigate(DEFAULT_ROUTE);
        return { success: true, retryable: false };
      } catch (error) {
        return {
          success: false,
          retryable: false,
          error: error as Error,
        };
      }
    }, [onAddEthereumChain, navigate]);

  const submitApproval = useCallback(async (): Promise<SubmissionResult> => {
    if (!currentConfirmation) {
      return { success: false, retryable: false };
    }

    try {
      await dispatch(resolvePendingApproval(currentConfirmation.id, undefined));

      return {
        success: true,
        retryable: false,
      };
    } catch (error) {
      const typedError = error as any;
      console.log('mimo error data cause', typedError?.data?.cause);
      console.log('mimo error cause', typedError?.cause);

      const isRetryable =
        typedError?.data?.cause?.retryStrategy === RetryStrategy.RETRY;

      if (isRetryable) {
        try {
          // Recreate the approval request using the cached confirmation
          const deleteAfterResult = Boolean(isLedgerAccount);
          await dispatch(
            resolvePendingApproval(currentConfirmation.id, undefined),
          );

          return {
            success: true,
            retryable: false,
          };
        } catch (retryError) {
          console.log('[useConfirmationSubmit] Retry failed:', retryError);
          return {
            success: false,
            retryable: false,
            error: retryError as Error,
          };
        }
      }

      return {
        success: false,
        retryable: false,
        error: error as Error,
      };
    }
  }, [currentConfirmation, dispatch, isLedgerAccount]);

  const submit = useCallback(async (): Promise<SubmissionResult> => {
    if (!currentConfirmation) {
      return { success: false, retryable: false };
    }

    const strategy = getStrategy();

    console.log('mimo strategy', strategy);
    let result: SubmissionResult;

    switch (strategy) {
      case 'add-ethereum-chain':
        result = await submitAddEthereumChain();
        break;
      case 'transaction': {
        result = await submitTransaction();
        onDappSwapCompleted();
        break;
      }
      case 'approval':
        result = await submitApproval();
        break;
      default:
        result = { success: false, retryable: false };
    }

    console.log('mimo result', result);

    // Handle successful submission cleanup
    if (result.success && !result.retryable) {
      // Clear hardware signing state
      await dispatch(setHardwareSigningState(null));

      // Close notification window
      dispatch(closeCurrentNotificationWindow());

      // Only navigate if not a Ledger account
      // For Ledger accounts, don't navigate away to keep the confirmation visible
      if (!isLedgerAccount && strategy !== 'add-ethereum-chain') {
        navigateNext(currentConfirmation.id);
      }
    }

    return result;
  }, [
    currentConfirmation,
    getStrategy,
    submitAddEthereumChain,
    submitApproval,
    submitTransaction,
    onDappSwapCompleted,
    dispatch,
    isLedgerAccount,
    navigateNext,
  ]);

  return { submit };
};
