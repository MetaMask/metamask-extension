import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { usePrevious } from '../../../hooks/usePrevious';
import { getIsHardwareWalletErrorModalVisible } from '../../../selectors';
import { Confirmation } from '../types/confirm';

export function useConfirmationNavigateHome(
  currentConfirmation: Confirmation | undefined,
) {
  const navigate = useNavigate();
  const previousConfirmation = usePrevious(currentConfirmation);
  const shouldNavigateHomeRef = useRef(false);
  const isHardwareWalletErrorModalVisible = useSelector(
    getIsHardwareWalletErrorModalVisible,
  );

  useEffect(() => {
    if (previousConfirmation && !currentConfirmation) {
      shouldNavigateHomeRef.current = true;
    }

    if (shouldNavigateHomeRef.current && !isHardwareWalletErrorModalVisible) {
      shouldNavigateHomeRef.current = false;
      navigate(`${DEFAULT_ROUTE}?tab=activity`, { replace: true });
    }
  }, [
    previousConfirmation,
    currentConfirmation,
    navigate,
    isHardwareWalletErrorModalVisible,
  ]);
}
