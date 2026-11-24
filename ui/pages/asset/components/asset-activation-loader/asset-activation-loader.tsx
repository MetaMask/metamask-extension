import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { STELLAR_WALLET_SNAP_ID } from '../../../../../shared/lib/accounts';
import LoadingScreen from '../../../../components/ui/loading-screen';
import { getUnapprovedTemplatedConfirmations } from '../../../../selectors';
import { CONFIRMATION_V_NEXT_ROUTE } from '../../../../helpers/constants/routes';

/**
 * Waits for the Stellar wallet snap confirmation dialog, then replaces this
 * route with it. Mirrors the non-EVM send loader so trustline activate/remove
 * works in fullscreen (where ConfirmationRouter does not auto-navigate).
 *
 * @returns Loading screen while the snap dialog is pending.
 */
export const AssetActivationLoader = () => {
  const navigate = useNavigate();
  const unapprovedTemplatedConfirmations = useSelector(
    getUnapprovedTemplatedConfirmations,
  );

  useEffect(() => {
    const pendingTrustlineDialog = unapprovedTemplatedConfirmations.find(
      (approval) => approval.origin === STELLAR_WALLET_SNAP_ID,
    );
    if (pendingTrustlineDialog) {
      navigate(`${CONFIRMATION_V_NEXT_ROUTE}/${pendingTrustlineDialog.id}`, {
        replace: true,
      });
    }
  }, [unapprovedTemplatedConfirmations, navigate]);

  return <LoadingScreen />;
};
