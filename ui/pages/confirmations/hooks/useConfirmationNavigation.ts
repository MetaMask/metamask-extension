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
  const count = confirmations.length;

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
      const url = getConfirmationRoute(
        confirmationId,
        confirmations,
        Boolean(approvalFlows?.length),
        queryString,
      );

      if (url) {
        navigate(url, { replace: true });
      }
    },
    [approvalFlows?.length, confirmations, navigate, queryString],
  );

  const navigateToIndex = useCallback(
    (index: number) => {
      const nextConfirmation = confirmations[index];
      navigateToId(nextConfirmation?.id);
    },
    [confirmations, navigateToId],
  );

  const navigateNext = useCallback(
    (confirmationId: string) => {
      const pendingConfirmations = confirmations.filter(
        (confirmation) => confirmation.id !== confirmationId,
      );
      if (pendingConfirmations.length >= 1) {
        const index = getIndex(pendingConfirmations[0].id);
        navigateToIndex(index);
      }
    },
    [confirmations, getIndex, navigateToIndex],
  );

  return {
    confirmations,
    count,
    getIndex,
    navigateToId,
    navigateToIndex,
    navigateNext,
  };
}

export function getConfirmationRoute(
  confirmationId: string | undefined,
  confirmations: ApprovalRequest<Record<string, Json>>[],
  hasApprovalFlows: boolean,
  queryString: string = '',
) {
  const hasNoConfirmations = confirmations?.length <= 0 || !confirmationId;

  if (hasApprovalFlows && hasNoConfirmations) {
    return CONFIRMATION_V_NEXT_ROUTE;
  }

  if (hasNoConfirmations) {
    return '';
  }

  const nextConfirmation = confirmations.find(
    (confirmation) => confirmation.id === confirmationId,
  );

  if (!nextConfirmation) {
    return '';
  }

  const type = nextConfirmation.type as ApprovalType;

  if (TEMPLATED_CONFIRMATION_APPROVAL_TYPES.includes(type)) {
    return `${CONFIRMATION_V_NEXT_ROUTE}/${confirmationId}`;
  }

  if (isSignatureTransactionType(nextConfirmation)) {
    return `${CONFIRM_TRANSACTION_ROUTE}/${confirmationId}${SIGNATURE_REQUEST_PATH}`;
  }
  if (type === ApprovalType.Transaction) {
    let url = `${CONFIRM_TRANSACTION_ROUTE}/${confirmationId}`;
    if (queryString.length) {
      url = `${url}${queryString}`;
    }
    return url;
  }

  if (type === ApprovalType.AddEthereumChain) {
    return `${CONFIRM_TRANSACTION_ROUTE}/${confirmationId}`;
  }

  if (type === ApprovalType.EthDecrypt) {
    return `${CONFIRM_TRANSACTION_ROUTE}/${confirmationId}${DECRYPT_MESSAGE_REQUEST_PATH}`;
  }

  if (type === ApprovalType.EthGetEncryptionPublicKey) {
    return `${CONFIRM_TRANSACTION_ROUTE}/${confirmationId}${ENCRYPTION_PUBLIC_KEY_REQUEST_PATH}`;
  }

  if (CONNECT_APPROVAL_TYPES.includes(type)) {
    return `${CONNECT_ROUTE}/${confirmationId}`;
  }

  const tokenId = (
    nextConfirmation?.requestData?.asset as Record<string, unknown>
  )?.tokenId as string;

  if (type === ApprovalType.WatchAsset && !tokenId) {
    return CONFIRM_ADD_SUGGESTED_TOKEN_ROUTE;
  }

  if (type === ApprovalType.WatchAsset && tokenId) {
    return CONFIRM_ADD_SUGGESTED_NFT_ROUTE;
  }

  return '';
}
