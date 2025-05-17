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
import { getApprovalFlows } from '../../../selectors';
import { selectReorderedPendingApprovalsForNavigation } from '../../../selectors/approvals';

export function useConfirmationNavigation() {
  const confirmations = useSelector(
    selectReorderedPendingApprovalsForNavigation,
  );
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
  const hasNoConfirmations = confirmations?.length <= 0 || !confirmationId;

  if (hasApprovalFlows && hasNoConfirmations) {
    history.replace(`${CONFIRMATION_V_NEXT_ROUTE}`);
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

  if (type === ApprovalType.WalletInstallSnap) {
    history.replace(`${CONNECT_ROUTE}/${confirmationId}/snap-install`);
    return;
  }

  if (type === ApprovalType.WalletUpdateSnap) {
    history.replace(`${CONNECT_ROUTE}/${confirmationId}/snap-update`);
    return;
  }

  if (type === ApprovalType.WalletInstallSnapResult) {
    history.replace(`${CONNECT_ROUTE}/${confirmationId}/snap-install-result`);
    return;
  }

  if (type === ApprovalType.WalletRequestPermissions) {
    history.replace(
      `${CONNECT_ROUTE}/${confirmationId}${
        (nextConfirmation.requestData?.permissions as Record<string, unknown>)
          ?.wallet_snap
          ? '/snaps-connect'
          : ''
      }`,
    );
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
