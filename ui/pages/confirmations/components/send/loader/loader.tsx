import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom-v5-compat';
import { useSelector } from 'react-redux';

import {
  BITCOIN_WALLET_SNAP_ID,
  SOLANA_WALLET_SNAP_ID,
  TRON_WALLET_SNAP_ID,
} from '../../../../../../shared/lib/accounts';
import LoadingScreen from '../../../../../components/ui/loading-screen';
import { getMemoizedUnapprovedTemplatedConfirmations } from '../../../../../selectors';
import { CONFIRMATION_V_NEXT_ROUTE } from '../../../../../helpers/constants/routes';

export const Loader = () => {
  const navigate = useNavigate();
  const unapprovedTemplatedConfirmations = useSelector(
    getMemoizedUnapprovedTemplatedConfirmations,
  );

  useEffect(() => {
    const pendingSend = unapprovedTemplatedConfirmations.find(
      (approval) =>
        approval.origin === SOLANA_WALLET_SNAP_ID ||
        approval.origin === BITCOIN_WALLET_SNAP_ID ||
        approval.origin === TRON_WALLET_SNAP_ID,
    );
    if (pendingSend) {
      navigate(`${CONFIRMATION_V_NEXT_ROUTE}/${pendingSend.id}`);
    }
  }, [unapprovedTemplatedConfirmations, navigate]);

  return <LoadingScreen />;
};
