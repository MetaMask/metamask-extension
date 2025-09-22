import React, { useCallback, useState } from 'react';
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

  const handleViewAccounts = useCallback(async () => {
    // Start loading when user clicks (not when modal opens)
    setIsLoading(true);

    try {
      await Promise.all([
        alignMultichainWallets(),
        new Promise((resolve) => setTimeout(resolve, 2000)), // Minimum 2s UX feedback
      ]);
    } catch (error) {
      console.error('Wallet alignment failed:', error);
      // Even if alignment fails, continue to account list
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

  const handleClose = useCallback(() => {
    // Mark modal as shown so it doesn't show again
    dispatch(setMultichainIntroModalShown(true));
    onClose();
  }, [dispatch, onClose]);

  const props: MultichainAccountIntroModalProps = {
    isOpen,
    onViewAccounts: handleViewAccounts,
    onLearnMore: handleLearnMore,
    onClose: handleClose,
    isLoading,
  };

  return <MultichainAccountIntroModal {...props} />;
};
