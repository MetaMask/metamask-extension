import { useSelector } from 'react-redux';

import {
  ApprovalsMetaMaskState,
  internalSelectPendingApproval,
} from '../../../selectors';
import { useConfirmationId } from './useConfirmationId';

export function useApprovalRequest() {
  const confirmationId = useConfirmationId();

  return useSelector((state) =>
    internalSelectPendingApproval(
      state as ApprovalsMetaMaskState,
      confirmationId ?? '',
    ),
  );
}
