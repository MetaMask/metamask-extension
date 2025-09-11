import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom-v5-compat';
import { ApprovalType } from '@metamask/controller-utils';
import { isEqual } from 'lodash';
import { ApprovalRequest } from '@metamask/approval-controller';
import { Json } from '@metamask/utils';

import { TEMPLATED_CONFIRMATION_APPROVAL_TYPES } from '../confirmation/templates';
import {
  CONFIRM_ADD_SUGGESTED_NFT_ROUTE,
  CONFIRM_ADD_SUGGESTED_TOKEN_ROUTE,
  CONFIRM_TRANSACTION_ROUTE,
  CONFIRMATION_V_NEXT_ROUTE,
  CONNECT_ROUTE,
  DECRYPT_MESSAGE_REQUEST_PATH,
  ENCRYPTION_PUBLIC_KEY_REQUEST_PATH,
  SIGNATURE_REQUEST_PATH,
} from '../../../helpers/constants/routes';
import { isSignatureTransactionType } from '../utils';
import {
  getApprovalFlows,
  selectPendingApprovalsForNavigation,
} from '../../../selectors';

const CONNECT_APPROVAL_TYPES = [
  ApprovalType.WalletRequestPermissions,
  'wallet_installSnap',
  'wallet_updateSnap',
  'wallet_installSnapResult',
];

export function useConfirmationNavigation() {
  const confirmations = useSelector(selectPendingApprovalsForNavigation);
  const approvalFlows = useSelector(getApprovalFlows, isEqual);
  const navigate = useNavigate();
  const { search: queryString } = useLocation();

  const getIndex = useCallback(
    (confirmationId?: string) => {
      if (!confirmationId) {
        return 0;
      }

      return confirmations.findIndex(({ id }) => id === confirmationId);
    },
    [confirmations],
  );

  const navigateToId = useCallback(
    (confirmationId?: string) => {
      navigateToConfirmation(
        confirmationId,
        confirmations,
        Boolean(approvalFlows?.length),
        navigate,
        queryString,
      );
    },
    [confirmations, navigate, queryString],
  );

  const navigateToIndex = useCallback(
    (index: number) => {
      const nextConfirmation = confirmations[index];
      navigateToId(nextConfirmation?.id);
    },
    [confirmations, navigateToId],
  );

  const count = confirmations.length;

  return { confirmations, count, getIndex, navigateToId, navigateToIndex };
}

export function navigateToConfirmation(
  confirmationId: string | undefined,
  confirmations: ApprovalRequest<Record<string, Json>>[],
  hasApprovalFlows: boolean,
  navigate: ReturnType<typeof useNavigate>,
  queryString: string = '',
) {
  const hasNoConfirmations = confirmations?.length <= 0 || !confirmationId;

  if (hasApprovalFlows && hasNoConfirmations) {
    navigate(`${CONFIRMATION_V_NEXT_ROUTE}`, { replace: true });
    return;
  }

  if (hasNoConfirmations) {
    return;
  }

  const nextConfirmation = confirmations.find(
    (confirmation) => confirmation.id === confirmationId,
  );

  if (!nextConfirmation) {
    return;
  }

  const type = nextConfirmation.type as ApprovalType;

  if (TEMPLATED_CONFIRMATION_APPROVAL_TYPES.includes(type)) {
    navigate(`${CONFIRMATION_V_NEXT_ROUTE}/${confirmationId}`, {
      replace: true,
    });
    return;
  }

  if (isSignatureTransactionType(nextConfirmation)) {
    navigate(
      `${CONFIRM_TRANSACTION_ROUTE}/${confirmationId}${SIGNATURE_REQUEST_PATH}`,
      { replace: true },
    );
    return;
  }

  if (type === ApprovalType.Transaction) {
    let url = `${CONFIRM_TRANSACTION_ROUTE}/${confirmationId}`;
    if (queryString.length) {
      url = `${url}${queryString}`;
    }
    navigate(url, { replace: true });
    return;
  }

  if (type === ApprovalType.EthDecrypt) {
    navigate(
      `${CONFIRM_TRANSACTION_ROUTE}/${confirmationId}${DECRYPT_MESSAGE_REQUEST_PATH}`,
      { replace: true },
    );
    return;
  }

  if (type === ApprovalType.EthGetEncryptionPublicKey) {
    navigate(
      `${CONFIRM_TRANSACTION_ROUTE}/${confirmationId}${ENCRYPTION_PUBLIC_KEY_REQUEST_PATH}`,
      { replace: true },
    );
    return;
  }

  if (CONNECT_APPROVAL_TYPES.includes(type)) {
    navigate(`${CONNECT_ROUTE}/${confirmationId}`, { replace: true });
    return;
  }

  const tokenId = (
    nextConfirmation?.requestData?.asset as Record<string, unknown>
  )?.tokenId as string;

  if (type === ApprovalType.WatchAsset && !tokenId) {
    navigate(`${CONFIRM_ADD_SUGGESTED_TOKEN_ROUTE}`, { replace: true });
    return;
  }

  if (type === ApprovalType.WatchAsset && tokenId) {
    navigate(`${CONFIRM_ADD_SUGGESTED_NFT_ROUTE}`, { replace: true });
  }
}
