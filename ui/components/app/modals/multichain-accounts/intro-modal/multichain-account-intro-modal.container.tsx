import React, {
  useCallback,
  useState,
  useEffect,
  useRef,
  useMemo,
} from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom-v5-compat';

import { captureException } from '../../../../../../shared/lib/sentry';

import {
  setMultichainAccountsIntroModalShown,
  alignMultichainWallets,
} from '../../../../../store/actions';
import { ACCOUNT_LIST_PAGE_ROUTE } from '../../../../../helpers/constants/routes';
import {
  MultichainAccountIntroModal,
  MultichainAccountIntroModalProps,
} from './multichain-account-intro-modal.component';

type ContainerProps = {
  onClose: () => void;
};

export const MultichainAccountIntroModalContainer: React.FC<ContainerProps> = ({
  onClose,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const isClosingRef = useRef(false);

  const MINIMUM_LOADING_TIME_MS = 2000;
  const SUPPORT_URL =
    'https://support.metamask.io/configure/accounts/multichain-accounts/';

  // Create alignment promise - always defined, no conditionals needed
  const alignmentPromise = useMemo(
    () =>
      alignMultichainWallets().catch((err) => {
        console.error('Wallet alignment failed:', err);
        captureException(err);
        // Even if alignment fails, we continue
        return Promise.resolve();
      }),
    [],
  );

  const handleViewAccounts = useCallback(async () => {
    // Start loading when user clicks
    setIsLoading(true);

    try {
      // Wait for alignment + minimum 2s UX delay
      await Promise.all([
        alignmentPromise,
        new Promise<void>((resolve) =>
          setTimeout(resolve, MINIMUM_LOADING_TIME_MS),
        ),
      ]);
    } catch (err) {
      // Error already captured when alignment promise was created
      // Don't capture again to avoid duplicate Sentry reports
    } finally {
      setIsLoading(false); // Clear loading state before closing modal
    }

    // Prevent race condition if modal was closed while aligning
    if (isClosingRef.current) {
      return;
    }
    isClosingRef.current = true;

    // Mark modal as shown so it doesn't show again
    dispatch(setMultichainAccountsIntroModalShown(true));
    onClose();

    // Navigate to account list
    navigate(ACCOUNT_LIST_PAGE_ROUTE);
  }, [alignmentPromise, dispatch, navigate, onClose]);

  const handleLearnMore = useCallback(() => {
    // Open multichain accounts support page
    window.open(SUPPORT_URL, '_blank', 'noopener,noreferrer');
  }, []);

  const handleClose = useCallback(async () => {
    // Prevent race condition if alignment is handling the close
    if (isClosingRef.current) {
      return;
    }
    isClosingRef.current = true;

    // Wait for alignment to complete
    try {
      await alignmentPromise;
    } catch (err) {
      // Silently handle alignment errors during close
      console.error('Alignment failed during modal close:', err);
    }

    // Mark modal as shown so it doesn't show again
    dispatch(setMultichainAccountsIntroModalShown(true));
    onClose();
  }, [dispatch, onClose, alignmentPromise]);

  // Clean up if component unmounts while loading
  useEffect(() => {
    return () => {
      // Let the alignment promise continue but don't wait for it
      alignmentPromise.catch(() => {
        // Silently handle cleanup errors
      });
    };
  }, [alignmentPromise]);

  const props: MultichainAccountIntroModalProps = {
    isOpen: true, // Always open when component is rendered
    onViewAccounts: handleViewAccounts,
    onLearnMore: handleLearnMore,
    onClose: handleClose,
    isLoading,
  };

  return <MultichainAccountIntroModal {...props} />;
};
