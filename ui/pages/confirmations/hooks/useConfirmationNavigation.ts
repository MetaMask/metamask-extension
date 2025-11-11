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
      navigateToConfirmation(
        confirmationId,
        confirmations,
        Boolean(approvalFlows?.length),
        navigate,
        queryString,
        undefined, // currentPathname not needed here as navigate already handles it
      );
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

export function navigateToConfirmation(
  confirmationId: string | undefined,
  confirmations: ApprovalRequest<Record<string, Json>>[],
  hasApprovalFlows: boolean,
  navigateOrHistory:
    | ReturnType<typeof useNavigate>
    | { push: (path: string) => void; replace: (path: string) => void },
  queryString: string = '',
  currentPathname?: string,
) {
  // Helper function to handle both navigate (v5-compat) and history (v5) APIs
  const navigateTo = (path: string, replace = true) => {
    // Skip navigation if we're already on the target path (compare pathnames only)
    if (currentPathname) {
      // Extract pathname from path (strip query params and hash)
      const targetPathname = path.split(/[?#]/u)[0];
      if (currentPathname === targetPathname) {
        return;
      }
    }

    if (
      'replace' in navigateOrHistory &&
      typeof navigateOrHistory.replace === 'function'
    ) {
      // v5 history API
      if (replace) {
        navigateOrHistory.replace(path);
      } else {
        navigateOrHistory.push(path);
      }
    } else {
      // v5-compat navigate API
      (navigateOrHistory as ReturnType<typeof useNavigate>)(path, { replace });
    }
  };

  const hasNoConfirmations = confirmations?.length <= 0 || !confirmationId;

  if (hasApprovalFlows && hasNoConfirmations) {
    navigateTo(`${CONFIRMATION_V_NEXT_ROUTE}`);
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
    navigateTo(`${CONFIRMATION_V_NEXT_ROUTE}/${confirmationId}`);
    return;
  }

  if (isSignatureTransactionType(nextConfirmation)) {
    navigateTo(
      `${CONFIRM_TRANSACTION_ROUTE}/${confirmationId}${SIGNATURE_REQUEST_PATH}`,
    );
    return;
  }

  if (type === ApprovalType.Transaction) {
    let url = `${CONFIRM_TRANSACTION_ROUTE}/${confirmationId}`;
    if (queryString.length) {
      url = `${url}${queryString}`;
    }
    navigateTo(url);
    return;
  }

  if (type === ApprovalType.AddEthereumChain) {
    navigateTo(`${CONFIRM_TRANSACTION_ROUTE}/${confirmationId}`);
    return;
  }

  if (type === ApprovalType.EthDecrypt) {
    navigateTo(
      `${CONFIRM_TRANSACTION_ROUTE}/${confirmationId}${DECRYPT_MESSAGE_REQUEST_PATH}`,
    );
    return;
  }

  if (type === ApprovalType.EthGetEncryptionPublicKey) {
    navigateTo(
      `${CONFIRM_TRANSACTION_ROUTE}/${confirmationId}${ENCRYPTION_PUBLIC_KEY_REQUEST_PATH}`,
    );
    return;
  }

  if (CONNECT_APPROVAL_TYPES.includes(type)) {
    navigateTo(`${CONNECT_ROUTE}/${confirmationId}`);
    return;
  }

  const tokenId = (
    nextConfirmation?.requestData?.asset as Record<string, unknown>
  )?.tokenId as string;

  if (type === ApprovalType.WatchAsset && !tokenId) {
    navigateTo(`${CONFIRM_ADD_SUGGESTED_TOKEN_ROUTE}`);
    return;
  }

  if (type === ApprovalType.WatchAsset && tokenId) {
    navigateTo(`${CONFIRM_ADD_SUGGESTED_NFT_ROUTE}`);
  }
}
