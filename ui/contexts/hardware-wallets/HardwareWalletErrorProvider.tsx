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
import { showModal, hideModal } from '../../store/actions';
import { HARDWARE_WALLET_ERROR_MODAL_NAME } from '../../components/app/modals/hardware-wallet-error-modal';
import {
  HardwareWalletProvider,
  useHardwareWalletConfig,
  useHardwareWalletState,
  useHardwareWalletActions,
} from './HardwareWalletContext.split';
import { ConnectionStatus } from './types';
import type { HardwareWalletError } from './errors';

const LOG_TAG = '[HardwareWalletErrorProvider]';

type HardwareWalletErrorContextType = {
  /**
   * Manually show the error modal with a specific error
   */
  showErrorModal: (error: HardwareWalletError) => void;

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
  createContext<HardwareWalletErrorContextType>({
    showErrorModal: () => undefined,
    dismissErrorModal: () => undefined,
    isErrorModalVisible: false,
  });

export const useHardwareWalletError = () =>
  useContext(HardwareWalletErrorContext);

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
  const { retry, clearError } = useHardwareWalletActions();

  // Store the current error to display (independent of connection state)
  const [displayedError, setDisplayedError] =
    useState<HardwareWalletError | null>(null);
  const isModalOpenRef = useRef(false);
  // Track the last error from connection state to detect resolution
  const lastConnectionErrorRef = useRef<HardwareWalletError | null>(null);

  /**
   * Handle retry action from the modal
   */
  const handleRetry = useCallback(async () => {
    console.log(LOG_TAG, 'Retry requested from modal');

    // Close the modal
    isModalOpenRef.current = false;
    setDisplayedError(null);
    lastConnectionErrorRef.current = null;
    dispatch(hideModal());

    // Attempt retry
    await retry();
  }, [retry, dispatch]);

  /**
   * Handle cancel/close action from the modal
   */
  const handleCancel = useCallback(() => {
    console.log(LOG_TAG, 'Cancel/Close requested from modal');
    isModalOpenRef.current = false;
    setDisplayedError(null);
    lastConnectionErrorRef.current = null;
    dispatch(hideModal());
    clearError();
  }, [clearError, dispatch]);

  /**
   * Manually dismiss the error modal
   */
  const dismissErrorModal = useCallback(() => {
    console.log(LOG_TAG, 'Dismissing error modal manually');
    if (isModalOpenRef.current) {
      isModalOpenRef.current = false;
      setDisplayedError(null);
      lastConnectionErrorRef.current = null;
      dispatch(hideModal());
    }
  }, [dispatch]);

  /**
   * Show error modal (internal implementation)
   */
  const showErrorModalInternal = useCallback(
    (error: HardwareWalletError, skipFilters = false) => {
      console.log(LOG_TAG, 'showErrorModalInternal called with:', {
        error,
        skipFilters,
        errorCode: error?.code,
        userActionable: error?.userActionable,
      });

      // Don't show modal for user cancellations (unless forced)
      if (
        !skipFilters &&
        (error.code === 'USER_CANCEL_001' || error.code === 'USER_CANCEL_002')
      ) {
        console.log(LOG_TAG, 'Skipping modal for user cancellation');
        return;
      }

      // Don't show if we're already displaying the exact same error instance (unless forced)
      if (!skipFilters && displayedError === error) {
        console.log(LOG_TAG, 'Already displaying this exact error instance');
        return;
      }

      // Always show the latest error - if a new error comes in, replace the current one
      if (
        isModalOpenRef.current &&
        displayedError &&
        displayedError !== error
      ) {
        console.log(LOG_TAG, 'Replacing current error with latest error:', {
          current: displayedError.code,
          new: error.code,
        });
      }

      console.log(LOG_TAG, 'Showing error modal:', error.code);
      console.log(LOG_TAG, 'Dispatching showModal with:', {
        name: HARDWARE_WALLET_ERROR_MODAL_NAME,
        errorCode: error?.code,
        errorMessage: error?.message,
        errorUserActionable: error?.userActionable,
      });
      setDisplayedError(error);
      isModalOpenRef.current = true;
      // Track this error so we know when it's resolved
      if (skipFilters) {
        // Manually shown errors - track them too
        lastConnectionErrorRef.current = error;
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
    [dispatch, handleRetry, handleCancel, displayedError],
  );

  /**
   * Manually show error modal (public API)
   * This allows components to manually trigger the error modal
   */
  const showErrorModal = useCallback(
    (error: HardwareWalletError) => {
      console.log(LOG_TAG, 'Manual showErrorModal called');
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
    // Reset state when not a hardware wallet account
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
      const error = connectionState.error as HardwareWalletError;
      lastConnectionErrorRef.current = error;

      // Only show modal for actionable errors
      if (error?.userActionable) {
        // Check if this is a different error than what we're currently displaying
        if (error !== displayedError) {
          showErrorModalInternal(error, false);
        }
      }
    }
  }, [
    connectionState,
    isHardwareWalletAccount,
    displayedError,
    showErrorModalInternal,
    dispatch,
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

  const contextValue = useMemo<HardwareWalletErrorContextType>(
    () => ({
      showErrorModal,
      dismissErrorModal,
      isErrorModalVisible: isModalOpenRef.current,
    }),
    [showErrorModal, dismissErrorModal],
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
