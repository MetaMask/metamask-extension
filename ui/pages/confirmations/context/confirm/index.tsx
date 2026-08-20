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
  /**
   * Whether the Money Account deposit/withdrawal amount the user currently
   * sees differs from the amount last committed to the transaction's
   * calldata. Read by the footer to keep Confirm disabled, so a Confirm
   * click can't sign against stale/placeholder calldata.
   *
   * Derived from `displayed !== committed` rather than tracked as in-flight
   * commit bookkeeping: a dropped debounce, a failed commit, or overlapping
   * edits all leave the amounts unequal and therefore fail closed, where
   * pending counters kept re-enabling Confirm the moment any one commit
   * settled.
   */
  isMoneyAccountAmountCommitPending: boolean;
  /**
   * Records the amount the user currently sees, the moment an edit is
   * scheduled. `confirmationId` must be the confirmation the edit belongs
   * to: `ConfirmContextProvider` is not remounted between confirmations, so
   * amounts are keyed by confirmation and a write for a confirmation the
   * user has already left cannot leak into the next one.
   */
  setMoneyAccountDisplayedAmount: (
    amountHuman: string,
    confirmationId: string,
  ) => void;
  /**
   * Records the amount a background commit actually wrote into the
   * transaction's calldata. Only ever called with the amount the resolved
   * commit was started for, so a superseded or abandoned commit landing
   * late cannot mark a newer displayed amount as committed.
   */
  setMoneyAccountCommittedAmount: (
    amountHuman: string,
    confirmationId: string,
  ) => void;
};

/**
 * The Money Account amount sync state for a single confirmation. Keyed by
 * confirmation id so stale writes from a confirmation the user has left are
 * ignored structurally, instead of being filtered against a ref that lags a
 * render behind (parent effects run after child effects, so an id ref is
 * stale exactly when a child schedules an edit on a fresh confirmation).
 */
type MoneyAccountAmountState = {
  confirmationId: string;
  displayedAmount: string;
  committedAmount?: string;
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
  const { goBackTo: goBackFromUrl } = useConfirmationNavigationOptions();
  const [goBackTo] = useState(goBackFromUrl);
  const [isScrollToBottomCompleted, setIsScrollToBottomCompleted] =
    useState(true);
  const [moneyAccountAmountState, setMoneyAccountAmountState] = useState<
    MoneyAccountAmountState | undefined
  >(undefined);
  const { currentConfirmation: currentConfirmationFromHook } =
    useCurrentConfirmation(confirmationId);
  const currentConfirmation =
    currentConfirmationOverride ?? currentConfirmationFromHook;
  const setMoneyAccountDisplayedAmount = useCallback(
    (amountHuman: string, forConfirmationId: string) => {
      setMoneyAccountAmountState((previous) =>
        previous?.confirmationId === forConfirmationId
          ? { ...previous, displayedAmount: amountHuman }
          : // A displayed amount for a new confirmation starts a fresh entry,
            // discarding whatever the previous confirmation had committed.
            { confirmationId: forConfirmationId, displayedAmount: amountHuman },
      );
    },
    [],
  );
  const setMoneyAccountCommittedAmount = useCallback(
    (amountHuman: string, forConfirmationId: string) => {
      setMoneyAccountAmountState((previous) =>
        previous?.confirmationId === forConfirmationId
          ? { ...previous, committedAmount: amountHuman }
          : // A commit landing for a confirmation whose entry is gone was
            // abandoned (the user moved on); it must not seed a new entry.
            previous,
      );
    },
    [],
  );

  /**
   * Pending unless the amounts match for the *current* confirmation. State
   * belonging to a confirmation the user has left never disables the next
   * one's Confirm — the id comparison happens here at read time, so no reset
   * effect is needed when the confirmation changes.
   */
  const isMoneyAccountAmountCommitPending =
    moneyAccountAmountState !== undefined &&
    moneyAccountAmountState.confirmationId === currentConfirmation?.id &&
    moneyAccountAmountState.displayedAmount !==
      moneyAccountAmountState.committedAmount;

  useSyncConfirmPath(
    currentConfirmationOverride === undefined ? currentConfirmation : undefined,
  );
  const navigate = useNavigate();
  const previousConfirmation = usePrevious(currentConfirmation);
  const shouldNavigateHomeRef = useRef(false);
  const isHardwareWalletErrorModalVisible = useSelector(
    getIsHardwareWalletErrorModalVisible,
  );

  /**
   * The hook below takes care of navigating to the home page when the confirmation not acted on by user
   * but removed by us, this can happen in cases like when dapp changes network.
   * We also skip navigation if the hardware wallet error modal is visible to allow for retry functionality.
   */
  useEffect(() => {
    if (currentConfirmationOverride !== undefined) {
      return;
    }
    if (previousConfirmation && !currentConfirmation) {
      shouldNavigateHomeRef.current = true;
    }

    if (shouldNavigateHomeRef.current && !isHardwareWalletErrorModalVisible) {
      shouldNavigateHomeRef.current = false;
      navigate(goBackTo ?? DEFAULT_ROUTE, { replace: true });
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
      isMoneyAccountAmountCommitPending,
      setMoneyAccountDisplayedAmount,
      setMoneyAccountCommittedAmount,
    }),
    [
      currentConfirmation,
      isScrollToBottomCompleted,
      setIsScrollToBottomCompleted,
      goBackTo,
      isMoneyAccountAmountCommitPending,
      setMoneyAccountDisplayedAmount,
      setMoneyAccountCommittedAmount,
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
    isMoneyAccountAmountCommitPending: boolean;
    setMoneyAccountDisplayedAmount: (
      amountHuman: string,
      confirmationId: string,
    ) => void;
    setMoneyAccountCommittedAmount: (
      amountHuman: string,
      confirmationId: string,
    ) => void;
  };
};
