import React, { useCallback, useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';

import {
  setMultichainIntroModalShown,
  alignMultichainWallets,
} from '../../../../../store/actions';
import { ACCOUNT_LIST_PAGE_ROUTE } from '../../../../../helpers/constants/routes';
import {
  MultichainAccountIntroModal,
  MultichainAccountIntroModalProps,
} from './multichain-account-intro-modal.component';

type ContainerProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const MultichainAccountIntroModalContainer: React.FC<ContainerProps> = ({
  isOpen,
  onClose,
}) => {
  const dispatch = useDispatch();
  const history = useHistory();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const alignmentPromiseRef = useRef<Promise<unknown> | null>(null);

  const handleViewAccounts = useCallback(async () => {
    // Start loading when user clicks (not when modal opens)
    setIsLoading(true);
    setError(null);

    try {
      // Create the alignment promise immediately when clicked
      const alignmentPromise = Promise.all([
        alignMultichainWallets(),
        new Promise<void>((resolve) => setTimeout(resolve, 2000)), // Minimum 2s UX feedback
      ]);

      // Store reference for handleClose
      alignmentPromiseRef.current = alignmentPromise;

      // Wait for alignment to complete
      await alignmentPromise;
      setError(null);
    } catch (err) {
      console.error('Wallet alignment failed:', err);
      setError(err instanceof Error ? err.message : 'Alignment failed');
      // Even if alignment fails, we continue
    } finally {
      setIsLoading(false); // Clear loading state before closing modal
      alignmentPromiseRef.current = null;
    }

    // Mark modal as shown so it doesn't show again
    dispatch(setMultichainIntroModalShown(true));
    onClose();

    // Navigate to account list
    history.push(ACCOUNT_LIST_PAGE_ROUTE);
  }, [dispatch, history, onClose]);

  const handleLearnMore = useCallback(() => {
    // Open multichain accounts support page
    window.open(
      'https://support.metamask.io/multichain-accounts',
      '_blank',
      'noopener,noreferrer',
    );
  }, []);

  const handleClose = useCallback(async () => {
    // Wait for alignment to complete if it's running (Charly's feedback)
    if (alignmentPromiseRef.current) {
      await alignmentPromiseRef.current;
    }

    // Mark modal as shown so it doesn't show again
    dispatch(setMultichainIntroModalShown(true));
    onClose();
  }, [dispatch, onClose]);

  // Clean up if component unmounts while loading
  useEffect(() => {
    return () => {
      if (alignmentPromiseRef.current) {
        // Let the promise continue but don't wait for it
        alignmentPromiseRef.current.catch(() => {
          // Silently handle cleanup errors
        });
        alignmentPromiseRef.current = null;
      }
    };
  }, []);

  const props: MultichainAccountIntroModalProps = {
    isOpen,
    onViewAccounts: handleViewAccounts,
    onLearnMore: handleLearnMore,
    onClose: handleClose,
    isLoading,
  };

  return <MultichainAccountIntroModal {...props} />;
};
