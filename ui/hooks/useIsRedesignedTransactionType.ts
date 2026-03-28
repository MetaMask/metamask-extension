import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { ApprovalType } from '@metamask/controller-utils';
import {
  selectIsTransactionTypeRedesigned,
  oldestPendingConfirmationSelector,
} from '../selectors';
import { isCorrectSignatureApprovalType } from '../../shared/lib/confirmation.utils';

export const useIsRedesignedConfirmationType = () => {
  const location = useLocation();
  const oldestPendingApproval = useSelector(oldestPendingConfirmationSelector);

  const paramsConfirmationId = location.pathname.split(
    '/confirm-transaction/',
  )[1];
  const confirmationId = paramsConfirmationId ?? oldestPendingApproval?.id;

  const isSupportedTransactionType = useSelector((state) =>
    selectIsTransactionTypeRedesigned(state, confirmationId),
  );

  const isSupportedApprovalType = isCorrectSignatureApprovalType(
    oldestPendingApproval?.type as ApprovalType,
  );

  return isSupportedTransactionType || isSupportedApprovalType;
};
