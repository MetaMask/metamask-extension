import {
  createAsyncMiddleware,
  type AsyncJsonRpcEngineNextCallback,
} from '@metamask/json-rpc-engine';
import type {
  Json,
  JsonRpcRequest,
  PendingJsonRpcResponse,
} from '@metamask/utils';
import log from 'loglevel';
import {
  getPartnerByOrigin,
  type DefiReferralPartnerConfig,
} from '../../../shared/constants/defi-referrals';

export type ExtendedJSONRPCRequest = JsonRpcRequest & {
  origin: string;
  tabId: number;
};

/**
 * Trigger types for referral flows
 */
export enum ReferralTriggerType {
  NewConnection = 'new_connection',
  OnNavigateConnectedTab = 'on_navigate_connected_tab',
}

function isExtendedJSONRPCRequest(
  req: JsonRpcRequest,
): req is ExtendedJSONRPCRequest {
  return (
    Boolean((req as ExtendedJSONRPCRequest).origin) &&
    Boolean((req as ExtendedJSONRPCRequest).tabId)
  );
}

/**
 * Creates middleware that monitors permission requests for DeFi referral partners.
 * When a permission is granted to a supported partner, it triggers the referral flow.
 *
 * @param handleDefiReferral - Function to handle the referral flow for a partner
 * @returns Middleware function
 */
export function createDefiReferralMiddleware(
  handleDefiReferral: (
    partner: DefiReferralPartnerConfig,
    tabId: number,
    triggerType: ReferralTriggerType,
  ) => Promise<void>,
) {
  return createAsyncMiddleware(
    async (
      req: JsonRpcRequest,
      res: PendingJsonRpcResponse<Json>,
      next: AsyncJsonRpcEngineNextCallback,
    ) => {
      // First, call next to process the request
      await next();

      if (!isExtendedJSONRPCRequest(req)) {
        return;
      }

      // Check if the origin matches a referral partner
      const partner = getPartnerByOrigin(req.origin);
      if (!partner) {
        return;
      }

      const isWalletRequestPermissions =
        req.method === 'wallet_requestPermissions';
      const isEthRequestAccounts = req.method === 'eth_requestAccounts';

      // Only continue if the request is a relevant connection request
      if (!isWalletRequestPermissions && !isEthRequestAccounts) {
        return;
      }

      let arePermissionsGranted = false;
      if (Array.isArray(res.result) && res.result.length > 0) {
        if (isWalletRequestPermissions) {
          // wallet_requestPermissions returns permission objects with parentCapability key
          const permissions = res.result as {
            parentCapability?: string;
          }[];
          arePermissionsGranted = permissions.some(
            (permission) => permission?.parentCapability === 'eth_accounts',
          );
        } else if (isEthRequestAccounts) {
          // eth_requestAccounts returns an array of address strings
          arePermissionsGranted = res.result.every(
            (address) => typeof address === 'string',
          );
        }
      }

      if (arePermissionsGranted) {
        handleDefiReferral(
          partner,
          req.tabId,
          ReferralTriggerType.NewConnection,
        ).catch((error) => {
          log.error(
            `Failed to handle ${partner.name} referral after permissions grant: `,
            error,
          );
        });
      }
    },
  );
}
