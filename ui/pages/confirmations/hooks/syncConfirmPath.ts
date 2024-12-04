import { useEffect } from 'react';
import { useParams } from 'react-router-dom';

import { ApprovalType, ORIGIN_METAMASK } from '@metamask/controller-utils';
import { ApprovalRequest } from '@metamask/approval-controller';
import { Json } from '@metamask/utils';
import { Confirmation } from '../types/confirm';
import { useConfirmationNavigation } from './useConfirmationNavigation';

const syncConfirmPath = (currentConfirmation?: Confirmation) => {
  const { navigateToId } = useConfirmationNavigation();
  const { id: paramId } = useParams<{ id: string }>();
  const confirmationId = currentConfirmation?.id;

  useEffect(() => {
    if (!confirmationId) {
      return;
    }

    const approvalRequest = currentConfirmation as ApprovalRequest<
      Record<string, Json>
    >;

    // Do not redirect if the current confirmation is a wallet triggered add network approval.
    // Handled by NetworkConfirmationPopover component in routes.
    if (
      approvalRequest.type === ApprovalType.AddEthereumChain &&
      approvalRequest.origin === ORIGIN_METAMASK
    ) {
      return;
    }

    if (!paramId) {
      navigateToId(confirmationId);
    }
  }, [confirmationId, paramId, navigateToId]);
};

export default syncConfirmPath;
