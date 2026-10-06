import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { BITCOIN_WALLET_SNAP_ID } from '../../../../../../shared/lib/accounts/bitcoin-wallet-snap';
import { SOLANA_WALLET_SNAP_ID } from '../../../../../../shared/lib/accounts/solana-wallet-snap';
import { TRON_WALLET_SNAP_ID } from '../../../../../../shared/lib/accounts/tron-wallet-snap';
import LoadingScreen from '../../../../../components/ui/loading-screen/loading-screen.component';
import { getUnapprovedTemplatedConfirmations } from '../../../../../selectors/selectors';
import { CONFIRMATION_V_NEXT_ROUTE } from '../../../../../helpers/constants/routes';

export const Loader = () => {
  const navigate = useNavigate();
  const unapprovedTemplatedConfirmations = useSelector(
    getUnapprovedTemplatedConfirmations,
  );

  useEffect(() => {
    const pendingSend = unapprovedTemplatedConfirmations.find(
      (approval) =>
        approval.origin === SOLANA_WALLET_SNAP_ID ||
        approval.origin === BITCOIN_WALLET_SNAP_ID ||
        approval.origin === TRON_WALLET_SNAP_ID,
    );
    if (pendingSend) {
      navigate(`${CONFIRMATION_V_NEXT_ROUTE}/${pendingSend.id}`, {
        replace: true,
      });
    }
  }, [unapprovedTemplatedConfirmations, navigate]);

  return <LoadingScreen />;
};
