import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';

import {
  hideModal,
  setMultichainIntroModalShown,
  alignMultichainWallets,
} from '../../../../../store/actions';
import { ACCOUNT_LIST_PAGE_ROUTE } from '../../../../../helpers/constants/routes';
import {
  MultichainAccountIntroModal,
  MultichainAccountIntroModalProps,
} from './multichain-account-intro-modal.component';

export const MultichainAccountIntroModalContainer: React.FC = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const [isAligning, setIsAligning] = useState(false);

  // Start alignment when modal opens (like mobile)
  useEffect(() => {
    const performAlignment = async () => {
      setIsAligning(true);
      try {
        await Promise.all([
          alignMultichainWallets(),
          new Promise((resolve) => setTimeout(resolve, 2000)), // Minimum 2s UX feedback
        ]);
      } catch (error) {
        console.error('Wallet alignment failed:', error);
      } finally {
        setIsAligning(false);
      }
    };

    performAlignment();
  }, []);

  const handleViewAccounts = useCallback(async () => {
    // If alignment is still in progress, wait for it
    if (isAligning) {
      // Wait for alignment to complete
      return;
    }

    // Mark modal as shown so it doesn't show again
    dispatch(setMultichainIntroModalShown(true));
    dispatch(hideModal());

    // Navigate to account list
    history.push(ACCOUNT_LIST_PAGE_ROUTE);
  }, [dispatch, history, isAligning]);

  const handleLearnMore = useCallback(() => {
    // Open multichain accounts support page
    window.open(
      'https://support.metamask.io/multichain-accounts',
      '_blank',
      'noopener,noreferrer',
    );
  }, []);

  const handleClose = useCallback(() => {
    // Mark modal as shown so it doesn't show again
    dispatch(setMultichainIntroModalShown(true));
    dispatch(hideModal());
  }, [dispatch]);

  const props: MultichainAccountIntroModalProps = {
    onViewAccounts: handleViewAccounts,
    onLearnMore: handleLearnMore,
    onClose: handleClose,
    isLoading: isAligning,
  };

  return <MultichainAccountIntroModal {...props} />;
};
