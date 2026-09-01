import React, {
  ReactElement,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { usePrevious } from '../../../../hooks/usePrevious';
import { getIsHardwareWalletErrorModalVisible } from '../../../../selectors';
import useCurrentConfirmation from '../../hooks/useCurrentConfirmation';
import { useConfirmationNavigationOptions } from '../../hooks/useConfirmationNavigation';
import useSyncConfirmPath from '../../hooks/useSyncConfirmPath';
import { DEFAULT_ROUTE } from '../../../../helpers/constants/routes';
import { Confirmation } from '../../types/confirm';

export type ConfirmContextType = {
  /** @deprecated Use useTransactionMetadataRequest or useSignatureRequest hooks instead. */
  currentConfirmation: Confirmation;
  isScrollToBottomCompleted: boolean;
  setIsScrollToBottomCompleted: (isScrollToBottomCompleted: boolean) => void;
  /** Route to use for cancel / reject / auto-exit; captured once from URL on mount. */
  goBackTo: string | undefined;
  /** Route back to the editable draft. Used only by Back, never by cancel / confirm / external-removal exits. */
  backTo: string | undefined;
  /** Declare where auto-exit navigates once the confirmation clears. Callers must NOT also call navigate() — that reintroduces the race this replaces. */
  setExitTarget: (exitTarget: ExitTarget) => void;
  clearExitTarget: () => void;
};

/** `confirmationId` scopes the target so an intent for one confirmation cannot redirect or swallow the exit of a later one. */
export type ExitTarget = {
  confirmationId: string;
  route: string;
};

export const ConfirmContext = createContext<ConfirmContextType | undefined>(
  undefined,
);

export const ConfirmContextProvider = ({
  children,
  confirmationId,
  currentConfirmationOverride,
}: React.PropsWithChildren<{
  children: ReactElement;
  confirmationId?: string;
  /** When provided, injects this as currentConfirmation (e.g. for gas modal opened from cancel-speedup). Skips route sync and navigation. */
  currentConfirmationOverride?: Confirmation;
}>) => {
  const { goBackTo: goBackFromUrl, backTo: backFromUrl } =
    useConfirmationNavigationOptions();
  const [goBackTo] = useState(goBackFromUrl);
  const [backTo] = useState(backFromUrl);
  const [isScrollToBottomCompleted, setIsScrollToBottomCompleted] =
    useState(true);
  const { currentConfirmation: currentConfirmationFromHook } =
    useCurrentConfirmation(confirmationId);
  const currentConfirmation =
    currentConfirmationOverride ?? currentConfirmationFromHook;

  useSyncConfirmPath(
    currentConfirmationOverride === undefined ? currentConfirmation : undefined,
  );
  const navigate = useNavigate();
  const previousConfirmation = usePrevious(currentConfirmation);
  const shouldNavigateHomeRef = useRef(false);
  const exitTargetRef = useRef<ExitTarget | undefined>(undefined);
  const exitedConfirmationIdRef = useRef<string | undefined>(undefined);
  const isHardwareWalletErrorModalVisible = useSelector(
    getIsHardwareWalletErrorModalVisible,
  );

  const setExitTarget = useCallback((exitTarget: ExitTarget) => {
    exitTargetRef.current = exitTarget;
  }, []);

  const clearExitTarget = useCallback(() => {
    exitTargetRef.current = undefined;
  }, []);

  /**
   * Sole owner of exit navigation, for both user-acted confirmations (which
   * declare an exit target first) and ones we removed ourselves, e.g. when a
   * dapp changes network. Action handlers must therefore never navigate
   * themselves: two owners disagreeing on the destination is the race that
   * landed send Back on Home (CONF-1865).
   *
   * Skipped while the hardware wallet error modal is visible, to allow retry.
   */
  useEffect(() => {
    if (currentConfirmationOverride !== undefined) {
      return;
    }
    if (previousConfirmation && !currentConfirmation) {
      shouldNavigateHomeRef.current = true;
      exitedConfirmationIdRef.current = previousConfirmation.id;
    }

    if (shouldNavigateHomeRef.current && !isHardwareWalletErrorModalVisible) {
      shouldNavigateHomeRef.current = false;

      const exitTarget = exitTargetRef.current;
      const exitedConfirmationId = exitedConfirmationIdRef.current;
      exitTargetRef.current = undefined;
      exitedConfirmationIdRef.current = undefined;

      const isTargetForExitedConfirmation =
        exitTarget !== undefined &&
        exitedConfirmationId !== undefined &&
        exitTarget.confirmationId === exitedConfirmationId;

      navigate(
        isTargetForExitedConfirmation
          ? exitTarget.route
          : (goBackTo ?? DEFAULT_ROUTE),
        { replace: true },
      );
    }
  }, [
    currentConfirmationOverride,
    previousConfirmation,
    currentConfirmation,
    navigate,
    goBackTo,
    isHardwareWalletErrorModalVisible,
  ]);

  const value = useMemo(
    () => ({
      currentConfirmation,
      isScrollToBottomCompleted,
      setIsScrollToBottomCompleted,
      goBackTo,
      backTo,
      setExitTarget,
      clearExitTarget,
    }),
    [
      currentConfirmation,
      isScrollToBottomCompleted,
      setIsScrollToBottomCompleted,
      goBackTo,
      backTo,
      setExitTarget,
      clearExitTarget,
    ],
  );

  return (
    <ConfirmContext.Provider value={value as ConfirmContextType}>
      {children}
    </ConfirmContext.Provider>
  );
};

export const useConfirmContext = <CurrentConfirmation = Confirmation>() => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error(
      'useConfirmContext must be used within an ConfirmContextProvider',
    );
  }
  return context as {
    /** @deprecated Use useTransactionMetadataRequest or useSignatureRequest hooks instead. */
    currentConfirmation: CurrentConfirmation;
    isScrollToBottomCompleted: boolean;
    setIsScrollToBottomCompleted: (isScrollToBottomCompleted: boolean) => void;
    goBackTo: string | undefined;
    backTo: string | undefined;
    setExitTarget: (exitTarget: ExitTarget) => void;
    clearExitTarget: () => void;
  };
};
