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
import { useDispatch } from 'react-redux';
import { ErrorCode, HardwareWalletError } from '@metamask/hw-wallet-sdk';
import {
  showModal,
  hideModal,
  setPendingHardwareSigning,
  closeCurrentNotificationWindow,
} from '../../store/actions';
import {
  HardwareWalletProvider,
  useHardwareWalletConfig,
  useHardwareWalletState,
  useHardwareWalletActions,
} from './HardwareWalletContext';
import { ConnectionStatus } from './types';

const LOG_TAG = '[HardwareWalletErrorProvider]';

const HARDWARE_WALLET_ERROR_MODAL_NAME = 'HARDWARE_WALLET_ERROR';
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

  // Optimized: Use split hooks to subscribe only to what we need
  const { isHardwareWalletAccount } = useHardwareWalletConfig();
  const { connectionState } = useHardwareWalletState();
  const { ensureDeviceReady, clearError } = useHardwareWalletActions();

  // Store the current error to display (independent of connection state)
  const [displayedError, setDisplayedError] = useState<unknown | null>(null);
  const isModalOpenRef = useRef(false);
  // Track the last error from connection state to detect resolution
  const lastConnectionErrorRef = useRef<unknown | null>(null);
  // Track if the modal was manually shown (vs from connection state)
  // Manually shown modals should NOT be dismissed based on selected account
  const isManuallyShownRef = useRef(false);

  /**
   * Handle retry action from the modal
   */
  const handleRetry = useCallback(async () => {
    console.log(LOG_TAG, 'Retry requested from modal');

    // Close the modal and clear the pending hardware signing flag
    isModalOpenRef.current = false;
    isManuallyShownRef.current = false;
    setDisplayedError(null);
    lastConnectionErrorRef.current = null;
    dispatch(hideModal());
    dispatch(setPendingHardwareSigning(false));

    // Attempt retry
    await ensureDeviceReady();
  }, [ensureDeviceReady, dispatch]);

  /**
   * Handle cancel/close action from the modal
   */
  const handleCancel = useCallback(() => {
    console.log(LOG_TAG, 'Cancel/Close requested from modal');
    isModalOpenRef.current = false;
    isManuallyShownRef.current = false;
    setDisplayedError(null);
    lastConnectionErrorRef.current = null;
    dispatch(hideModal());
    dispatch(setPendingHardwareSigning(false));
    clearError();
    // Close the popup if there are no more pending approvals
    dispatch(closeCurrentNotificationWindow());
  }, [clearError, dispatch]);

  /**
   * Manually dismiss the error modal
   */
  const dismissErrorModal = useCallback(() => {
    console.log(LOG_TAG, 'Dismissing error modal manually');
    if (isModalOpenRef.current) {
      isModalOpenRef.current = false;
      isManuallyShownRef.current = false;
      setDisplayedError(null);
      lastConnectionErrorRef.current = null;
      dispatch(hideModal());
      dispatch(setPendingHardwareSigning(false));
      // Close the popup if there are no more pending approvals
      dispatch(closeCurrentNotificationWindow());
    }
  }, [dispatch]);

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
    const errorCode = (error as { code?: number })?.code;
    if (
      errorCode === ErrorCode.UserRejected ||
      errorCode === ErrorCode.UserCancelled
    ) {
      return true;
    }

    // Check for RPC error format with data.code
    const rpcErrorCode = (error as { data?: { code?: number } })?.data?.code;
    return (
      rpcErrorCode === ErrorCode.UserRejected ||
      rpcErrorCode === ErrorCode.UserCancelled
    );
  }, []);

  /**
   * Show error modal (internal implementation)
   */
  const showErrorModalInternal = useCallback(
    (error: unknown, skipFilters = false) => {
      console.log('[HW_DEBUG MODAL] showErrorModalInternal called with:', {
        error,
        skipFilters,
        errorCode: (error as { code?: number })?.code,
      });

      // For user rejections/cancellations: dismiss any open modal and close the popup
      // This applies regardless of skipFilters - user rejections should ALWAYS dismiss
      if (isUserRejection(error)) {
        console.log(
          '[HW_DEBUG MODAL] User rejection/cancellation detected - dismissing modal and closing popup',
        );
        if (isModalOpenRef.current) {
          isModalOpenRef.current = false;
          isManuallyShownRef.current = false;
          setDisplayedError(null);
          lastConnectionErrorRef.current = null;
          dispatch(hideModal());
        }
        // Clear pendingHardwareSigning and close the popup
        dispatch(setPendingHardwareSigning(false));
        dispatch(closeCurrentNotificationWindow());
        return;
      }

      // Don't show if we're already displaying the exact same error instance (unless forced)
      if (!skipFilters && displayedError === error) {
        console.log(
          '[HW_DEBUG MODAL] Already displaying this exact error instance',
        );
        return;
      }

      console.log(
        '[HW_DEBUG MODAL] Setting displayedError and isModalOpenRef=true',
      );
      setDisplayedError(error);
      isModalOpenRef.current = true;
      // Track this error so we know when it's resolved
      if (skipFilters) {
        // Manually shown errors - track them and mark as manually shown
        // so they won't be dismissed by the selected account check
        lastConnectionErrorRef.current = error;
        isManuallyShownRef.current = true;
      }

      const modalPayload = {
        name: HARDWARE_WALLET_ERROR_MODAL_NAME,
        error,
        onRetry: handleRetry,
        onCancel: handleCancel,
        isOpen: true,
      };
      console.log(
        '[HW_DEBUG MODAL] Dispatching showModal with name:',
        HARDWARE_WALLET_ERROR_MODAL_NAME,
      );
      dispatch(showModal(modalPayload));
      console.log(
        '[HW_DEBUG MODAL] showModal dispatched - Redux should now have modal state',
      );
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
    // Don't dismiss manually shown modals based on selected account.
    // This is important for signature flows where the signing account
    // (from msgParams.from) may be a hardware wallet even if the
    // currently selected account is not.
    if (isManuallyShownRef.current) {
      return;
    }

    // Reset state when not a hardware wallet account (for auto-shown modals only)
    if (!isHardwareWalletAccount && displayedError) {
      setDisplayedError(null);
      lastConnectionErrorRef.current = null;
      if (isModalOpenRef.current) {
        isModalOpenRef.current = false;
        dispatch(hideModal());
      }
      return;
    }

    if (!isHardwareWalletAccount) {
      return;
    }

    // Check if we have a NEW error state
    if (connectionState.status === ConnectionStatus.ErrorState) {
      const { error } = connectionState;
      if (!error) {
        return;
      }

      // Check if this is actually a different error by comparing error codes
      // Object reference equality (error !== displayedError) doesn't work reliably
      // because new error objects are created each time connection state changes
      const errorCode = (error as { code?: number })?.code;
      const lastErrorCode = (
        lastConnectionErrorRef.current as { code?: number }
      )?.code;

      // Only show modal if the error code has changed
      // OR if we haven't shown an error yet (displayedError is null)
      // Note: showErrorModalInternal will handle user rejections by dismissing the modal
      if (errorCode !== lastErrorCode || !displayedError) {
        lastConnectionErrorRef.current = error;
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
  ]);

  /**
   * Cleanup modal on unmount
   */
  useEffect(() => {
    return () => {
      if (isModalOpenRef.current) {
        dispatch(hideModal());
        isModalOpenRef.current = false;
        setDisplayedError(null);
        lastConnectionErrorRef.current = null;
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
