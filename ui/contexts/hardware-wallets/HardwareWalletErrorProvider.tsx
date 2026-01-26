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
import { ErrorCode } from '@metamask/hw-wallet-sdk';
import { showModal, hideModal } from '../../store/actions';
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
    await ensureDeviceReady();
  }, [ensureDeviceReady, dispatch]);

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
    (error: unknown, skipFilters = false) => {
      console.log(LOG_TAG, 'showErrorModalInternal called with:', {
        error,
        skipFilters,
        errorCode: (error as any)?.code,
      });

      // Don't show modal for user cancellations (unless forced)
      if (
        (!skipFilters && (error as any)?.code === ErrorCode.UserRejected) ||
        (error as any)?.code === ErrorCode.UserCancelled
      ) {
        console.log(LOG_TAG, 'Skipping modal for user cancellation');
        return;
      }

      // Don't show if we're already displaying the exact same error instance (unless forced)
      if (!skipFilters && displayedError === error) {
        console.log(LOG_TAG, 'Already displaying this exact error instance');
        return;
      }

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
      const { error } = connectionState;
      if (!error) {
        return;
      }

      // Check if this is actually a different error by comparing error codes
      // Object reference equality (error !== displayedError) doesn't work reliably
      // because new error objects are created each time connection state changes
      const errorCode = (error as any)?.code;
      const lastErrorCode = (lastConnectionErrorRef.current as any)?.code;

      // Only show modal if the error code has changed
      // OR if we haven't shown an error yet (displayedError is null)
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
