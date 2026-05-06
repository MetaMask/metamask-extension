import React, {
  ReactElement,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { TransactionType } from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { isCorrectDeveloperTransactionType } from '../../../../../shared/lib/confirmation.utils';
import { useHardwareWalletSigningBehavior } from '../../../../contexts/hardware-wallets';
import { usePrevious } from '../../../../hooks/usePrevious';
import { getIsHardwareWalletErrorModalVisible } from '../../../../selectors';
import useCurrentConfirmation from '../../hooks/useCurrentConfirmation';
import { useConfirmationNavigationOptions } from '../../hooks/useConfirmationNavigation';
import useSyncConfirmPath from '../../hooks/useSyncConfirmPath';
import { DEFAULT_ROUTE } from '../../../../helpers/constants/routes';
import { Confirmation } from '../../types/confirm';
import { isSignatureTransactionType } from '../../utils';

export type ConfirmContextType = {
  /** @deprecated Use useTransactionMetadataRequest or useSignatureRequest hooks instead. */
  currentConfirmation: Confirmation;
  isScrollToBottomCompleted: boolean;
  setIsScrollToBottomCompleted: (isScrollToBottomCompleted: boolean) => void;
  /** Route to use for cancel / reject / auto-exit; captured once from URL on mount. */
  goBackTo: string | undefined;
};

export const ConfirmContext = createContext<ConfirmContextType | undefined>(
  undefined,
);

export const ConfirmContextProvider: React.FC<{
  children: ReactElement;
  confirmationId?: string;
  /** When provided, injects this as currentConfirmation (e.g. for gas modal opened from cancel-speedup). Skips route sync and navigation. */
  currentConfirmationOverride?: Confirmation;
}> = ({ children, confirmationId, currentConfirmationOverride }) => {
  const { goBackTo: goBackFromUrl } = useConfirmationNavigationOptions();
  const [goBackTo] = useState(goBackFromUrl);
  const [isScrollToBottomCompleted, setIsScrollToBottomCompleted] =
    useState(true);
  const isLoading = useSelector(
    (state: { appState?: { isLoading?: boolean } }) =>
      Boolean(state.appState?.isLoading),
  );
  const { currentConfirmation: currentConfirmationFromHook } =
    useCurrentConfirmation(confirmationId);
  const previousConfirmation = usePrevious(currentConfirmationFromHook);
  const { keepConfirmationOpenDuringSigning } =
    useHardwareWalletSigningBehavior();
  const confirmationForLoading =
    currentConfirmationFromHook ?? previousConfirmation;
  const isTransactionOrSignatureConfirmation = Boolean(
    isSignatureTransactionType(confirmationForLoading) ||
      isCorrectDeveloperTransactionType(
        confirmationForLoading?.type as TransactionType,
      ),
  );
  const shouldKeepConfirmationOpenDuringSigning =
    isLoading &&
    keepConfirmationOpenDuringSigning &&
    isTransactionOrSignatureConfirmation;
  const currentConfirmation =
    currentConfirmationOverride ??
    currentConfirmationFromHook ??
    (shouldKeepConfirmationOpenDuringSigning
      ? previousConfirmation
      : undefined);

  useSyncConfirmPath(
    currentConfirmationOverride === undefined
      ? currentConfirmationFromHook
      : undefined,
  );
  const navigate = useNavigate();
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
    if (previousConfirmation && !currentConfirmationFromHook) {
      shouldNavigateHomeRef.current = true;
    }

    if (
      shouldNavigateHomeRef.current &&
      !isHardwareWalletErrorModalVisible &&
      !shouldKeepConfirmationOpenDuringSigning
    ) {
      shouldNavigateHomeRef.current = false;
      navigate(goBackTo ?? DEFAULT_ROUTE, { replace: true });
    }
  }, [
    currentConfirmationOverride,
    previousConfirmation,
    currentConfirmationFromHook,
    navigate,
    goBackTo,
    isHardwareWalletErrorModalVisible,
    shouldKeepConfirmationOpenDuringSigning,
  ]);

  const value = useMemo(
    () => ({
      currentConfirmation,
      isScrollToBottomCompleted,
      setIsScrollToBottomCompleted,
      goBackTo,
    }),
    [
      currentConfirmation,
      isScrollToBottomCompleted,
      setIsScrollToBottomCompleted,
      goBackTo,
    ],
  );

  return (
    <ConfirmContext.Provider value={value}>{children}</ConfirmContext.Provider>
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
  };
};
