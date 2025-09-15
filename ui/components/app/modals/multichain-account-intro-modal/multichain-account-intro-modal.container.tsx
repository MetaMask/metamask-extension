import React, { useCallback, useContext } from 'react';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';

import { MetaMetricsEventName } from '../../../../../shared/constants/metametrics';
import {
  hideModal,
  setMultichainIntroModalShown,
  alignMultichainWallets,
} from '../../../../store/actions';
import { ACCOUNT_LIST_PAGE_ROUTE } from '../../../../helpers/constants/routes';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import {
  MultichainAccountIntroModal,
  MultichainAccountIntroModalProps,
} from './multichain-account-intro-modal.component';

export const MultichainAccountIntroModalContainer: React.FC = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const trackEvent = useContext(MetaMetricsContext);

  const handleViewAccounts = useCallback(async () => {
    // Track analytics
    trackEvent({
      category: 'Multichain Accounts',
      event: MetaMetricsEventName.MultichainAccountIntroViewAccounts,
      properties: {
        location: 'intro_modal',
      },
    });

    const startTime = Date.now();

    try {
      // Trigger multichain wallet alignment
      await alignMultichainWallets();
    } catch (error) {
      console.error('Failed to align multichain wallets:', error);
      // Continue even if alignment fails
    }

    // Ensure minimum 2 seconds loading time
    const elapsedTime = Date.now() - startTime;
    const remainingTime = Math.max(0, 2000 - elapsedTime);
    if (remainingTime > 0) {
      await new Promise((resolve) => setTimeout(resolve, remainingTime));
    }

    // Mark modal as shown so it doesn't show again
    dispatch(setMultichainIntroModalShown(true));
    dispatch(hideModal());

    // Navigate to account list
    history.push(ACCOUNT_LIST_PAGE_ROUTE);
  }, [dispatch, history, trackEvent]);

  const handleLearnMore = useCallback(() => {
    // Track analytics
    trackEvent({
      category: 'Multichain Accounts',
      event: MetaMetricsEventName.MultichainAccountIntroLearnMore,
      properties: {
        location: 'intro_modal',
      },
    });

    // Open multichain accounts support page
    window.open(
      'https://support.metamask.io/multichain-accounts',
      '_blank',
      'noopener,noreferrer',
    );
  }, [trackEvent]);

  const handleClose = useCallback(() => {
    // Mark modal as shown so it doesn't show again
    dispatch(setMultichainIntroModalShown(true));
    dispatch(hideModal());
  }, [dispatch]);

  const props: MultichainAccountIntroModalProps = {
    onViewAccounts: handleViewAccounts,
    onLearnMore: handleLearnMore,
    onClose: handleClose,
  };

  return <MultichainAccountIntroModal {...props} />;
};
