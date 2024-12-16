import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
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
  pendingApprovalsSortedSelector,
} from '../../../selectors';

const CONNECT_APPROVAL_TYPES = [
  ApprovalType.WalletRequestPermissions,
  'wallet_installSnap',
  'wallet_updateSnap',
  'wallet_installSnapResult',
];

export function useConfirmationNavigation() {
  const confirmations = useSelector(pendingApprovalsSortedSelector, isEqual);
  const approvalFlows = useSelector(getApprovalFlows, isEqual);
  const history = useHistory();

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
        history,
      );
    },
    [confirmations, history],
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
  history: ReturnType<typeof useHistory>,
) {
  if (hasApprovalFlows) {
    history.replace(`${CONFIRMATION_V_NEXT_ROUTE}`);
    return;
  }

  if (confirmations?.length <= 0 || !confirmationId) {
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
    history.replace(`${CONFIRMATION_V_NEXT_ROUTE}/${confirmationId}`);
    return;
  }

  if (isSignatureTransactionType(nextConfirmation)) {
    history.replace(
      `${CONFIRM_TRANSACTION_ROUTE}/${confirmationId}${SIGNATURE_REQUEST_PATH}`,
    );
    return;
  }

  if (type === ApprovalType.Transaction) {
    history.replace(`${CONFIRM_TRANSACTION_ROUTE}/${confirmationId}`);
    return;
  }

  if (type === ApprovalType.EthDecrypt) {
    history.replace(
      `${CONFIRM_TRANSACTION_ROUTE}/${confirmationId}${DECRYPT_MESSAGE_REQUEST_PATH}`,
    );
    return;
  }

  if (type === ApprovalType.EthGetEncryptionPublicKey) {
    history.replace(
      `${CONFIRM_TRANSACTION_ROUTE}/${confirmationId}${ENCRYPTION_PUBLIC_KEY_REQUEST_PATH}`,
    );
    return;
  }

  if (CONNECT_APPROVAL_TYPES.includes(type)) {
    history.replace(`${CONNECT_ROUTE}/${confirmationId}`);
    return;
  }

  const tokenId = (
    nextConfirmation?.requestData?.asset as Record<string, unknown>
  )?.tokenId as string;

  if (type === ApprovalType.WatchAsset && !tokenId) {
    history.replace(`${CONFIRM_ADD_SUGGESTED_TOKEN_ROUTE}`);
    return;
  }

  if (type === ApprovalType.WatchAsset && tokenId) {
    history.replace(`${CONFIRM_ADD_SUGGESTED_NFT_ROUTE}`);
  }
}
