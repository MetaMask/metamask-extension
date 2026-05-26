import { useSelector } from 'react-redux';

import {
  ApprovalsMetaMaskState,
  selectPendingApproval,
} from '../../../selectors';
import { useConfirmationId } from './useConfirmationId';

export function useApprovalRequest() {
  const confirmationId = useConfirmationId();

  return useSelector((state) =>
    selectPendingApproval(
      state as ApprovalsMetaMaskState,
      confirmationId ?? '',
    ),
  );
}
