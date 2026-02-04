import {
  createAsyncMiddleware,
  type AsyncJsonRpcEngineNextCallback,
} from '@metamask/json-rpc-engine';
import { ValidPermission, type Caveat } from '@metamask/permission-controller';
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
      res: PendingJsonRpcResponse<
        ValidPermission<string, Caveat<string, Json>>[]
      >,
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

      // After the request is processed, check if it was a successful permission grant
      const isConnectionRequest = req.method === 'wallet_requestPermissions';
      const arePermissionsGranted =
        Array.isArray(res.result) &&
        res.result.some(
          (permission) => permission?.parentCapability === 'eth_accounts',
        );

      if (isConnectionRequest && arePermissionsGranted) {
        handleDefiReferral(
          partner,
          req.tabId,
          ReferralTriggerType.NewConnection,
        ).catch((error) => {
          log.error(
            `Failed to handle ${partner.name} referral after wallet_requestPermissions grant: `,
            error,
          );
        });
      }
    },
  );
}
