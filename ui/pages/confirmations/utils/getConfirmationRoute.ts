import { ApprovalType } from '@metamask/controller-utils';
import { ApprovalRequest } from '@metamask/approval-controller';
import { Json } from '@metamask/utils';
import {
  CONFIRM_TRANSACTION_ROUTE,
  CONFIRMATION_V_NEXT_ROUTE,
  CONNECT_ROUTE,
  DECRYPT_MESSAGE_REQUEST_PATH,
  ENCRYPTION_PUBLIC_KEY_REQUEST_PATH,
  SIGNATURE_REQUEST_PATH,
  CONFIRM_ADD_SUGGESTED_TOKEN_ROUTE,
  CONFIRM_ADD_SUGGESTED_NFT_ROUTE,
} from '../../../helpers/constants/routes';
import { TEMPLATED_CONFIRMATION_APPROVAL_TYPES } from '../confirmation/templates';
import { isSignatureTransactionType } from './confirm';

const CONNECT_APPROVAL_TYPES = [
  ApprovalType.WalletRequestPermissions,
  'wallet_installSnap',
  'wallet_updateSnap',
  'wallet_installSnapResult',
];

export type ConfirmationRouteInfo = {
  route: string;
  component?:
    | 'ConfirmationPage'
    | 'ConfirmTransaction'
    | 'PermissionsConnect'
    | 'ConfirmAddSuggestedTokenPage'
    | 'ConfirmAddSuggestedNftPage';
};

/**
 * Route patterns for dynamic route generation
 * These patterns correspond to the routes returned by getConfirmationRoute
 */
const ROUTE_PATTERNS: Array<{
  pattern: string;
  component: ConfirmationRouteInfo['component'];
}> = [
  {
    pattern: `${CONFIRMATION_V_NEXT_ROUTE}/:id`,
    component: 'ConfirmationPage',
  },
  {
    pattern: `${CONFIRM_TRANSACTION_ROUTE}/:id${SIGNATURE_REQUEST_PATH}`,
    component: 'ConfirmTransaction',
  },
  {
    pattern: `${CONFIRM_TRANSACTION_ROUTE}/:id${DECRYPT_MESSAGE_REQUEST_PATH}`,
    component: 'ConfirmTransaction',
  },
  {
    pattern: `${CONFIRM_TRANSACTION_ROUTE}/:id${ENCRYPTION_PUBLIC_KEY_REQUEST_PATH}`,
    component: 'ConfirmTransaction',
  },
  {
    pattern: `${CONFIRM_TRANSACTION_ROUTE}/:id`,
    component: 'ConfirmTransaction',
  },
  {
    pattern: `${CONNECT_ROUTE}/:id`,
    component: 'PermissionsConnect',
  },
  {
    pattern: CONFIRM_ADD_SUGGESTED_TOKEN_ROUTE,
    component: 'ConfirmAddSuggestedTokenPage',
  },
  {
    pattern: CONFIRM_ADD_SUGGESTED_NFT_ROUTE,
    component: 'ConfirmAddSuggestedNftPage',
  },
];

/**
 * Gets all route patterns for dynamic route generation
 */
export function getConfirmationRoutePatterns(): Array<{
  pattern: string;
  component: ConfirmationRouteInfo['component'];
}> {
  return ROUTE_PATTERNS;
}

/**
 * Determines the route path and component for a given confirmation
 * @param confirmation - The approval request to route
 * @param confirmationId - The ID of the confirmation
 * @returns Route info with path and optional component type, or null if no route matches
 */
export function getConfirmationRoute(
  confirmation: ApprovalRequest<Record<string, Json>> | undefined,
  confirmationId: string | undefined,
): ConfirmationRouteInfo | null {
  if (!confirmation || !confirmationId) {
    return null;
  }

  const type = confirmation.type as ApprovalType;

  // Templated confirmations
  if (TEMPLATED_CONFIRMATION_APPROVAL_TYPES.includes(type)) {
    return {
      route: `${CONFIRMATION_V_NEXT_ROUTE}/${confirmationId}`,
      component: 'ConfirmationPage',
    };
  }

  // Signature requests
  if (isSignatureTransactionType(confirmation)) {
    return {
      route: `${CONFIRM_TRANSACTION_ROUTE}/${confirmationId}${SIGNATURE_REQUEST_PATH}`,
      component: 'ConfirmTransaction',
    };
  }

  // Transactions
  if (type === ApprovalType.Transaction) {
    return {
      route: `${CONFIRM_TRANSACTION_ROUTE}/${confirmationId}`,
      component: 'ConfirmTransaction',
    };
  }

  // Add Ethereum Chain
  if (type === ApprovalType.AddEthereumChain) {
    return {
      route: `${CONFIRM_TRANSACTION_ROUTE}/${confirmationId}`,
      component: 'ConfirmTransaction',
    };
  }

  // Decrypt message
  if (type === ApprovalType.EthDecrypt) {
    return {
      route: `${CONFIRM_TRANSACTION_ROUTE}/${confirmationId}${DECRYPT_MESSAGE_REQUEST_PATH}`,
      component: 'ConfirmTransaction',
    };
  }

  // Encryption public key
  if (type === ApprovalType.EthGetEncryptionPublicKey) {
    return {
      route: `${CONFIRM_TRANSACTION_ROUTE}/${confirmationId}${ENCRYPTION_PUBLIC_KEY_REQUEST_PATH}`,
      component: 'ConfirmTransaction',
    };
  }

  // Connect requests
  if (CONNECT_APPROVAL_TYPES.includes(type)) {
    return {
      route: `${CONNECT_ROUTE}/${confirmationId}`,
      component: 'PermissionsConnect',
    };
  }

  // Watch asset (token)
  const tokenId = (confirmation?.requestData?.asset as Record<string, unknown>)
    ?.tokenId as string;

  if (type === ApprovalType.WatchAsset && !tokenId) {
    return {
      route: CONFIRM_ADD_SUGGESTED_TOKEN_ROUTE,
      component: 'ConfirmAddSuggestedTokenPage',
    };
  }

  // Watch asset (NFT)
  if (type === ApprovalType.WatchAsset && tokenId) {
    return {
      route: CONFIRM_ADD_SUGGESTED_NFT_ROUTE,
      component: 'ConfirmAddSuggestedNftPage',
    };
  }

  return null;
}
