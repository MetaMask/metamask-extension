import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

import { useEffect } from 'react';
import {
  getMemoizedUnapprovedTemplatedConfirmations,
  getMemoizedUnapprovedConfirmations,
} from '../../../selectors';
import { SOLANA_WALLET_SNAP_ID } from '../../../../shared/lib/accounts';
import {
  CONFIRM_TRANSACTION_ROUTE,
  CONFIRMATION_V_NEXT_ROUTE,
} from '../../../helpers/constants/routes';

/**
 * This hook is used to redirect to the confirmation page if an unapproved confirmation exists
 * It is used in the submitBridgeTransaction hook to redirect to the confirmation page after submitting a snap transaction
 */
export default function useSnapConfirmation() {
  const history = useHistory();

  // Find unapproved confirmations which the snap has initiated
  const unapprovedTemplatedConfirmations = useSelector(
    getMemoizedUnapprovedTemplatedConfirmations,
  );
  const unapprovedConfirmations = useSelector(
    getMemoizedUnapprovedConfirmations,
  );

  // Redirect to the confirmation page if an unapproved confirmation exists
  useEffect(() => {
    const templatedSnapApproval = unapprovedTemplatedConfirmations.find(
      (approval) => approval.origin === SOLANA_WALLET_SNAP_ID,
    );
    const snapApproval = unapprovedConfirmations.find(
      (approval) => approval.origin === SOLANA_WALLET_SNAP_ID,
    );
    if (templatedSnapApproval) {
      history.push(`${CONFIRMATION_V_NEXT_ROUTE}/${templatedSnapApproval.id}`);
    } else if (snapApproval) {
      history.push(`${CONFIRM_TRANSACTION_ROUTE}/${snapApproval.id}`);
    }
  }, [history, unapprovedTemplatedConfirmations, unapprovedConfirmations]);
}
