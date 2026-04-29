import { TransactionMeta } from '@metamask/transaction-controller';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { isCorrectDeveloperTransactionType } from '../../../../../../shared/lib/confirmation.utils';
import { DEFAULT_ROUTE } from '../../../../../helpers/constants/routes';
import { useConfirmationNavigation } from '../../../hooks/useConfirmationNavigation';
import { resolvePendingApproval } from '../../../../../store/actions';
import { useConfirmContext } from '../../../context/confirm';
import { useTransactionConfirm } from '../../../hooks/transactions/useTransactionConfirm';
import { useConfirmActions } from '../../../hooks/useConfirmActions';
import {
  isAddEthereumChainType,
  useAddEthereumChain,
} from '../../../hooks/useAddEthereumChain';
import { getConfirmationSender } from '../utils';

export type ResolvePendingApprovalOptions = NonNullable<
  Parameters<typeof resolvePendingApproval>[2]
>;

type UseConfirmationSubmitOptions = {
  beforeSubmit?: () => Promise<boolean>;
  resolveApprovalOptions?: Omit<ResolvePendingApprovalOptions, 'fromAddress'>;
  withResolvePendingApproval?: (
    request: () => Promise<void>,
  ) => () => Promise<void>;
};

const resolveImmediately = (request: () => Promise<void>) => request;

export function useConfirmationSubmit({
  beforeSubmit,
  resolveApprovalOptions,
  withResolvePendingApproval = resolveImmediately,
}: UseConfirmationSubmitOptions = {}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { onTransactionConfirm } = useTransactionConfirm();
  const { navigateNext } = useConfirmationNavigation();
  const { onSubmit: onAddEthereumChain } = useAddEthereumChain();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const currentConfirmationId = currentConfirmation?.id;
  const { from: fromAddress } = getConfirmationSender(currentConfirmation);
  const { resetTransactionState } = useConfirmActions();
  const isTransactionConfirmation = isCorrectDeveloperTransactionType(
    currentConfirmation?.type,
  );
  const isAddEthereumChain = isAddEthereumChainType(currentConfirmation);

  return useCallback(async () => {
    if (!currentConfirmation) {
      return;
    }

    if (beforeSubmit) {
      const shouldContinue = await beforeSubmit();
      if (!shouldContinue) {
        return;
      }
    }

    try {
      if (isAddEthereumChain) {
        await onAddEthereumChain();
        navigate(DEFAULT_ROUTE);
        return;
      }

      if (isTransactionConfirmation) {
        const didConfirm = await onTransactionConfirm();
        if (didConfirm && currentConfirmationId) {
          navigateNext(currentConfirmationId);
        }
        return;
      }

      const resolveApproval = async () => {
        await dispatch(
          resolvePendingApproval(currentConfirmation.id, undefined, {
            fromAddress,
            ...resolveApprovalOptions,
          }),
        );

        if (currentConfirmationId) {
          navigateNext(currentConfirmationId);
        }
      };

      await withResolvePendingApproval(resolveApproval)();
    } finally {
      resetTransactionState();
    }
  }, [
    beforeSubmit,
    currentConfirmation,
    currentConfirmationId,
    isAddEthereumChain,
    isTransactionConfirmation,
    onAddEthereumChain,
    navigate,
    onTransactionConfirm,
    navigateNext,
    dispatch,
    fromAddress,
    resolveApprovalOptions,
    withResolvePendingApproval,
    resetTransactionState,
  ]);
}
