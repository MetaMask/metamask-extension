import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { ApprovalType } from '@metamask/controller-utils';
import {
  selectIsTransactionTypeRedesigned,
  oldestPendingConfirmationSelector,
  getPendingApprovals,
} from '../selectors';
import { isCorrectSignatureApprovalType } from '../../shared/lib/confirmation.utils';

export const useIsRedesignedConfirmationType = () => {
  const location = useLocation();
  const oldestPendingApproval = useSelector(oldestPendingConfirmationSelector);
  const pendingApprovals = useSelector(getPendingApprovals);

  const paramsConfirmationId = location.pathname.split(
    '/confirm-transaction/',
  )[1];
  const confirmationId = paramsConfirmationId ?? oldestPendingApproval?.id;

  const isSupportedTransactionType = useSelector((state) =>
    selectIsTransactionTypeRedesigned(state, confirmationId),
  );

  const pendingApproval = pendingApprovals.find(
    (approval) => approval.id === confirmationId,
  );
  const isSupportedApprovalType = isCorrectSignatureApprovalType(
    pendingApproval?.type as ApprovalType | undefined,
  );

  return isSupportedTransactionType || isSupportedApprovalType;
};
