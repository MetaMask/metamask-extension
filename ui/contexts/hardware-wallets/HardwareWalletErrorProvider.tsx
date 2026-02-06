import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ErrorCode, HardwareWalletError } from '@metamask/hw-wallet-sdk';
import {
  showModal,
  hideModal,
  setPendingHardwareWalletSigning,
  closeCurrentNotificationWindow,
} from '../../store/actions';
import { getIsHardwareWalletErrorModalVisible } from '../../selectors';
import {
  HardwareWalletProvider,
  useHardwareWalletConfig,
  useHardwareWalletState,
  useHardwareWalletActions,
} from './HardwareWalletContext';
import { ConnectionStatus } from './types';
import { HARDWARE_WALLET_ERROR_MODAL_NAME } from './constants';
import {
  getHardwareWalletErrorCode,
  isUserRejectedHardwareWalletError,
} from './rpcErrorUtils';

type HardwareWalletErrorContextType = {
  /**
   * Manually show the error modal with a specific error
   */
  showErrorModal: (error: unknown) => void;

  /**
   * Manually dismiss the error modal
   */
  dismissErrorModal: () => void;

  /**
   * Check if an error modal is currently displayed
   */
  isErrorModalVisible: boolean;
};

const HardwareWalletErrorContext =
  createContext<HardwareWalletErrorContextType | null>(null);

export const useHardwareWalletError = (): HardwareWalletErrorContextType => {
  const context = useContext(HardwareWalletErrorContext);
  if (!context) {
    throw new Error(
      'useHardwareWalletError must be used within HardwareWalletErrorProvider',
    );
  }
  return context;
};

type HardwareWalletErrorProviderProps = {
  children: ReactNode;
};

/**
 * Internal component that monitors the hardware wallet context for errors
 *
 * @param options0 - The component props
 * @param options0.children - Child components to render
 */
const HardwareWalletErrorMonitor: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const dispatch = useDispatch();
  const isHardwareWalletErrorModalVisible = useSelector(
    getIsHardwareWalletErrorModalVisible,
  );

  // Optimized: Use split hooks to subscribe only to what we need
  const { isHardwareWalletAccount } = useHardwareWalletConfig();
  const { connectionState } = useHardwareWalletState();
  const { clearError } = useHardwareWalletActions();

  // Store the current error to display (independent of connection state)
  const [displayedError, setDisplayedError] = useState<unknown | null>(null);
  const isModalOpenRef = useRef(false);
  const wasModalVisibleRef = useRef(isHardwareWalletErrorModalVisible);
  // Track if the modal was manually shown (vs from connection state)
  // Manually shown modals should NOT be dismissed based on selected account
  const isManuallyShownRef = useRef(false);

  const resetModalState = useCallback(() => {
    isModalOpenRef.current = false;
    isManuallyShownRef.current = false;
    setDisplayedError(null);
    dispatch(hideModal());
    dispatch(setPendingHardwareWalletSigning(false));
  }, [dispatch]);

  /**
   * Handle retry action from the modal
   */
  const handleRetry = useCallback(() => {
    // Clear pending signing so the user can retry after success.
    dispatch(setPendingHardwareWalletSigning(false));
  }, [dispatch]);

  /**
   * Handle cancel/close action from the modal
   */
  const handleCancel = useCallback(() => {
    resetModalState();
    clearError();
    // Close the popup if there are no more pending approvals
    dispatch(closeCurrentNotificationWindow());
  }, [clearError, dispatch, resetModalState]);

  /**
   * Manually dismiss the error modal
   */
  const dismissErrorModal = useCallback(() => {
    if (isModalOpenRef.current) {
      resetModalState();
      clearError();
      // Close the popup if there are no more pending approvals
      dispatch(closeCurrentNotificationWindow());
    }
  }, [clearError, dispatch, resetModalState]);

  /**
   * Check if an error is a user rejection (UserRejected or UserCancelled)
   */
  const isUserRejection = useCallback((error: unknown): boolean => {
    if (error instanceof HardwareWalletError) {
      return (
        error.code === ErrorCode.UserRejected ||
        error.code === ErrorCode.UserCancelled
      );
    }

    // Also check by code directly for errors that lost their class type
    const errorCode = getHardwareWalletErrorCode(error);
    return (
      errorCode === ErrorCode.UserRejected ||
      errorCode === ErrorCode.UserCancelled
    );
  }, []);

  /**
   * Show error modal (internal implementation)
   */
  const showErrorModalInternal = useCallback(
    (error: unknown, skipFilters = false) => {
      // For user rejections/cancellations: dismiss any open modal and close the popup
      // unless explicitly forced (manual calls can show these errors)
      if (!skipFilters && isUserRejection(error)) {
        if (isModalOpenRef.current) {
          isModalOpenRef.current = false;
          isManuallyShownRef.current = false;
          setDisplayedError(null);
          dispatch(hideModal());
        }
        // Clear pendingHardwareWalletSigning and close the popup
        dispatch(setPendingHardwareWalletSigning(false));
        dispatch(closeCurrentNotificationWindow());
        return;
      }

      // Don't show if we're already displaying the exact same error instance (unless forced)
      if (!skipFilters && displayedError === error) {
        return;
      }

      setDisplayedError(error);
      isModalOpenRef.current = true;
      if (skipFilters) {
        // Manually shown errors - mark them as manually shown
        // so they won't be dismissed by the selected account check
        isManuallyShownRef.current = true;
      }

      const modalPayload = {
        name: HARDWARE_WALLET_ERROR_MODAL_NAME,
        error,
        onRetry: handleRetry,
        onCancel: handleCancel,
        isOpen: true,
      };
      dispatch(showModal(modalPayload));
    },
    [dispatch, handleRetry, handleCancel, displayedError, isUserRejection],
  );

  /**
   * Manually show error modal (public API)
   * This allows components to manually trigger the error modal
   */
  const showErrorModal = useCallback(
    (error: unknown) => {
      // When called manually, we skip the filters (allow user cancellations, duplicates, etc.)
      showErrorModalInternal(error, true);
    },
    [showErrorModalInternal],
  );

  /**
   * Monitor connection state for NEW errors
   * Only capture errors, don't auto-dismiss when state changes
   */
  useEffect(() => {
    if (
      wasModalVisibleRef.current &&
      !isHardwareWalletErrorModalVisible &&
      isModalOpenRef.current
    ) {
      resetModalState();
    }
    wasModalVisibleRef.current = isHardwareWalletErrorModalVisible;
  }, [isHardwareWalletErrorModalVisible, resetModalState]);

  useEffect(() => {
    // Don't dismiss manually shown modals based on selected account.
    // This is important for signature flows where the signing account
    // (from msgParams.from) may be a hardware wallet even if the
    // currently selected account is not.
    if (isManuallyShownRef.current) {
      return;
    }

    // Reset state when not a hardware wallet account (for auto-shown modals only)
    if (!isHardwareWalletAccount && displayedError) {
      resetModalState();
      return;
    }

    if (!isHardwareWalletAccount) {
      return;
    }

    // Check if we have a NEW error state
    if (connectionState.status === ConnectionStatus.ErrorState) {
      const { error } = connectionState;
      if (!error || isUserRejectedHardwareWalletError(error)) {
        return;
      }

      // Check if this is actually a different error by comparing error codes
      // Object reference equality (error !== displayedError) doesn't work reliably
      // because new error objects are created each time connection state changes
      const errorCode = getHardwareWalletErrorCode(error);
      const displayedErrorCode = getHardwareWalletErrorCode(displayedError);

      // Only show modal if the error code has changed
      // OR if we haven't shown an error yet (displayedError is null)
      // Note: showErrorModalInternal will handle user rejections by dismissing the modal
      if (errorCode !== displayedErrorCode || !displayedError) {
        setDisplayedError(error);
        showErrorModalInternal(error, false);
      }
    }
  }, [
    connectionState,
    isHardwareWalletAccount,
    showErrorModalInternal,
    dispatch,
    displayedError,
    resetModalState,
  ]);

  /**
   * Cleanup modal on unmount
   */
  useEffect(() => {
    return () => {
      if (isModalOpenRef.current) {
        dispatch(hideModal());
        dispatch(setPendingHardwareWalletSigning(false));
        isModalOpenRef.current = false;
        setDisplayedError(null);
      }
    };
  }, [dispatch]);

  // Use displayedError to determine visibility instead of ref
  // This ensures the context value updates when the modal state changes
  const isErrorModalVisible = displayedError !== null;

  const contextValue = useMemo<HardwareWalletErrorContextType>(
    () => ({
      showErrorModal,
      dismissErrorModal,
      isErrorModalVisible,
    }),
    [showErrorModal, dismissErrorModal, isErrorModalVisible],
  );

  return (
    <HardwareWalletErrorContext.Provider value={contextValue}>
      {children}
    </HardwareWalletErrorContext.Provider>
  );
};

/**
 * Provider that monitors hardware wallet errors and displays them via modals.
 * This provider wraps the HardwareWalletProvider and uses the HardwareWalletContext
 * to detect errors and show appropriate modals with recovery instructions.
 *
 * @param options0 - The component props
 * @param options0.children - Child components to render
 */
export const HardwareWalletErrorProvider: React.FC<
  HardwareWalletErrorProviderProps
> = ({ children }) => {
  return (
    <HardwareWalletProvider>
      <HardwareWalletErrorMonitor>{children}</HardwareWalletErrorMonitor>
    </HardwareWalletProvider>
  );
};
