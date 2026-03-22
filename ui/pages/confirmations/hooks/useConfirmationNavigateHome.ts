import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { usePrevious } from '../../../hooks/usePrevious';
import { getIsHardwareWalletErrorModalVisible } from '../../../selectors';
import { useApprovalRequest } from './useApprovalRequest';

export function useConfirmationNavigateHome() {
  const navigate = useNavigate();
  const approvalRequest = useApprovalRequest();
  const previousApprovalRequest = usePrevious(approvalRequest);
  const shouldNavigateHomeRef = useRef(false);
  const isHardwareWalletErrorModalVisible = useSelector(
    getIsHardwareWalletErrorModalVisible,
  );

  useEffect(() => {
    if (previousApprovalRequest && !approvalRequest) {
      shouldNavigateHomeRef.current = true;
    }

    if (shouldNavigateHomeRef.current && !isHardwareWalletErrorModalVisible) {
      shouldNavigateHomeRef.current = false;
      navigate(`${DEFAULT_ROUTE}?tab=activity`, { replace: true });
    }
  }, [
    previousApprovalRequest,
    approvalRequest,
    navigate,
    isHardwareWalletErrorModalVisible,
  ]);
}
