import React, {
  ReactElement,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { DEFAULT_ROUTE } from '../../../../helpers/constants/routes';
import { usePrevious } from '../../../../hooks/usePrevious';
import {
  getPendingHardwareSigning,
  getIsHardwareWalletErrorModalVisible,
} from '../../../../selectors';
import useCurrentConfirmation from '../../hooks/useCurrentConfirmation';
import useSyncConfirmPath from '../../hooks/useSyncConfirmPath';
import { Confirmation } from '../../types/confirm';

export type ConfirmContextType = {
  currentConfirmation: Confirmation;
  isScrollToBottomCompleted: boolean;
  setIsScrollToBottomCompleted: (isScrollToBottomCompleted: boolean) => void;
};

export const ConfirmContext = createContext<ConfirmContextType | undefined>(
  undefined,
);

export const ConfirmContextProvider: React.FC<{
  children: ReactElement;
  confirmationId?: string;
}> = ({ children, confirmationId }) => {
  const [isScrollToBottomCompleted, setIsScrollToBottomCompleted] =
    useState(true);
  const { currentConfirmation } = useCurrentConfirmation(confirmationId);
  useSyncConfirmPath(currentConfirmation);
  const navigate = useNavigate();
  const previousConfirmation = usePrevious(currentConfirmation);
  const dispatch = useDispatch();
  const isPendingHardwareSigning = useSelector(getPendingHardwareSigning);
  const isHardwareWalletErrorModalVisible = useSelector(
    getIsHardwareWalletErrorModalVisible,
  );

  /**
   * The hook below takes care of navigating to the home page when the confirmation not acted on by user
   * but removed by us, this can happen in cases like when dapp changes network.
   * We skip navigation if a hardware wallet transaction is being signed to prevent premature navigation.
   * We also skip navigation if the hardware wallet error modal is visible to allow for retry functionality.
   */
  useEffect(() => {
    const wouldNavigate = previousConfirmation && !currentConfirmation;
    const isBlocked =
      isPendingHardwareSigning || isHardwareWalletErrorModalVisible;

    // Always log when this effect runs to trace timing
    console.log('[HW_DEBUG NAV ConfirmContext] useEffect triggered:', {
      hasPreviousConfirmation: Boolean(previousConfirmation),
      hasCurrentConfirmation: Boolean(currentConfirmation),
      previousConfirmationId: (previousConfirmation as any)?.id,
      isPendingHardwareSigning,
      isHardwareWalletErrorModalVisible,
      wouldNavigate,
      isBlocked,
      willNavigate: wouldNavigate && !isBlocked,
    });

    if (wouldNavigate && !isBlocked) {
      console.log('[HW_DEBUG NAV ConfirmContext] NAVIGATING TO HOME');
      navigate(`${DEFAULT_ROUTE}?tab=activity`, { replace: true });
    } else if (wouldNavigate && isBlocked) {
      console.log('[HW_DEBUG NAV ConfirmContext] BLOCKED - not navigating');
    }
  }, [
    previousConfirmation,
    currentConfirmation,
    navigate,
    dispatch,
    isPendingHardwareSigning,
    isHardwareWalletErrorModalVisible,
  ]);

  const value = useMemo(
    () => ({
      currentConfirmation,
      isScrollToBottomCompleted,
      setIsScrollToBottomCompleted,
    }),
    [
      currentConfirmation,
      isScrollToBottomCompleted,
      setIsScrollToBottomCompleted,
    ],
  );

  return (
    <ConfirmContext.Provider value={value}>{children}</ConfirmContext.Provider>
  );
};

export const useConfirmContext = <CurrentConfirmation = Confirmation,>() => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error(
      'useConfirmContext must be used within an ConfirmContextProvider',
    );
  }
  return context as {
    currentConfirmation: CurrentConfirmation;
    isScrollToBottomCompleted: boolean;
    setIsScrollToBottomCompleted: (isScrollToBottomCompleted: boolean) => void;
  };
};
