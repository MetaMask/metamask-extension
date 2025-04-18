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
  console.log('🧭 navigateToConfirmation called with:', {
    confirmationId,
    confirmationsCount: confirmations?.length,
    hasApprovalFlows,
    confirmations: confirmations?.map(c => ({ id: c.id, type: c.type }))
  });

  const hasNoConfirmations = confirmations?.length <= 0 || !confirmationId;

  if (hasApprovalFlows && hasNoConfirmations) {
    console.log('🔄 Navigating to confirmation v_next with no specific confirmation');
    history.replace(`${CONFIRMATION_V_NEXT_ROUTE}`);
    return;
  }

  if (hasNoConfirmations) {
    console.log('⚠️ No confirmations available, not navigating');
    return;
  }

  const nextConfirmation = confirmations.find(
    (confirmation) => confirmation.id === confirmationId,
  );

  if (!nextConfirmation) {
    console.log('⚠️ Confirmation not found:', confirmationId);
    return;
  }

  const type = nextConfirmation.type as ApprovalType;
  console.log(`📝 Processing confirmation type: ${type}`);

  if (TEMPLATED_CONFIRMATION_APPROVAL_TYPES.includes(type)) {
    console.log(`🔄 Navigating to templated confirmation: ${CONFIRMATION_V_NEXT_ROUTE}/${confirmationId}`);
    history.replace(`${CONFIRMATION_V_NEXT_ROUTE}/${confirmationId}`);
    return;
  }

  if (isSignatureTransactionType(nextConfirmation)) {
    console.log(`🔄 Navigating to signature request: ${CONFIRM_TRANSACTION_ROUTE}/${confirmationId}${SIGNATURE_REQUEST_PATH}`);
    history.replace(
      `${CONFIRM_TRANSACTION_ROUTE}/${confirmationId}${SIGNATURE_REQUEST_PATH}`,
    );
    return;
  }

  if (type === ApprovalType.Transaction) {
    console.log(`🔄 Navigating to transaction: ${CONFIRM_TRANSACTION_ROUTE}/${confirmationId}`);
    history.replace(`${CONFIRM_TRANSACTION_ROUTE}/${confirmationId}`);
    return;
  }

  if (type === ApprovalType.EthDecrypt) {
    console.log(`🔄 Navigating to decrypt message: ${CONFIRM_TRANSACTION_ROUTE}/${confirmationId}${DECRYPT_MESSAGE_REQUEST_PATH}`);
    history.replace(
      `${CONFIRM_TRANSACTION_ROUTE}/${confirmationId}${DECRYPT_MESSAGE_REQUEST_PATH}`,
    );
    return;
  }

  if (type === ApprovalType.EthGetEncryptionPublicKey) {
    console.log(`🔄 Navigating to encryption public key: ${CONFIRM_TRANSACTION_ROUTE}/${confirmationId}${ENCRYPTION_PUBLIC_KEY_REQUEST_PATH}`);
    history.replace(
      `${CONFIRM_TRANSACTION_ROUTE}/${confirmationId}${ENCRYPTION_PUBLIC_KEY_REQUEST_PATH}`,
    );
    return;
  }

  if (type === 'wallet_installSnap') {
    console.log(`🔄 Navigating to connect route: ${CONNECT_ROUTE}/${confirmationId}/snap-install`);
    console.log('🔍 Connect approval details:', {
      id: nextConfirmation.id,
      type: nextConfirmation.type,
      requestData: {
        ...nextConfirmation.requestData,
        permissions: Object.keys(nextConfirmation.requestData?.permissions || {})
      },
      origin: nextConfirmation.origin,
    });
    history.replace(`${CONNECT_ROUTE}/${confirmationId}/snap-install`);
    return;
  }

  if (type === 'wallet_updateSnap') {
    console.log(`🔄 Navigating to connect route: ${CONNECT_ROUTE}/${confirmationId}/snap-update`);
    console.log('🔍 Connect approval details:', {
      id: nextConfirmation.id,
      type: nextConfirmation.type,
      requestData: {
        ...nextConfirmation.requestData,
        permissions: Object.keys(nextConfirmation.requestData?.permissions || {})
      },
      origin: nextConfirmation.origin,
    });
    history.replace(`${CONNECT_ROUTE}/${confirmationId}/snap-update`);
    return;
  }

  if (type === 'wallet_installSnapResult') {
    console.log(`🔄 Navigating to connect route: ${CONNECT_ROUTE}/${confirmationId}/snap-install-result`);
    console.log('🔍 Connect approval details:', {
      id: nextConfirmation.id,
      type: nextConfirmation.type,
      requestData: {
        ...nextConfirmation.requestData,
        permissions: Object.keys(nextConfirmation.requestData?.permissions || {})
      },
      origin: nextConfirmation.origin,
    });
    history.replace(`${CONNECT_ROUTE}/${confirmationId}/snap-install-result`);
    return;
  }

  if (type === ApprovalType.WalletRequestPermissions) {
    console.log(`🔄 Navigating to connect route: ${CONNECT_ROUTE}/${confirmationId}`);
    console.log('🔍 Connect approval details:', {
      id: nextConfirmation.id,
      type: nextConfirmation.type,
      requestData: {
        ...nextConfirmation.requestData,
        permissions: Object.keys(nextConfirmation.requestData?.permissions || {})
      },
      origin: nextConfirmation.origin,
    });
    history.replace(`${CONNECT_ROUTE}/${confirmationId}`);
    return;
  }

  const tokenId = (
    nextConfirmation?.requestData?.asset as Record<string, unknown>
  )?.tokenId as string;

  if (type === ApprovalType.WatchAsset && !tokenId) {
    console.log(`🔄 Navigating to add token: ${CONFIRM_ADD_SUGGESTED_TOKEN_ROUTE}`);
    history.replace(`${CONFIRM_ADD_SUGGESTED_TOKEN_ROUTE}`);
    return;
  }

  if (type === ApprovalType.WatchAsset && tokenId) {
    console.log(`🔄 Navigating to add NFT: ${CONFIRM_ADD_SUGGESTED_NFT_ROUTE}`);
    history.replace(`${CONFIRM_ADD_SUGGESTED_NFT_ROUTE}`);
  }
}
