import React, { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { SOLANA_WALLET_SNAP_ID } from '../../../../../../shared/lib/accounts';
import LoadingScreen from '../../../../../components/ui/loading-screen';
import { getMemoizedUnapprovedTemplatedConfirmations } from '../../../../../selectors';
import { CONFIRMATION_V_NEXT_ROUTE } from '../../../../../helpers/constants/routes';

export const Loader = () => {
  const history = useHistory();
  const unapprovedTemplatedConfirmations = useSelector(
    getMemoizedUnapprovedTemplatedConfirmations,
  );

  useEffect(() => {
    const pendingSend = unapprovedTemplatedConfirmations.find(
      (approval) => approval.origin === SOLANA_WALLET_SNAP_ID,
    );
    if (pendingSend) {
      history.push(`${CONFIRMATION_V_NEXT_ROUTE}/${pendingSend.id}`);
    }
  }, [unapprovedTemplatedConfirmations, history]);

  return <LoadingScreen />;
};
