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
import { HYPERLIQUID_ORIGIN } from '../../../shared/constants/referrals';

export type ExtendedJSONRPCRequest = JsonRpcRequest & {
  origin: string;
  tabId: number;
};

export enum HyperliquidPermissionTriggerType {
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
 * Creates middleware that monitors permission requests for Hyperliquid.
 * When a permission is granted to Hyperliquid, it triggers the referral flow.
 *
 * @param handleHyperliquidReferral - Function to handle the referral flow
 * @returns Middleware function
 */
export function createHyperliquidReferralMiddleware(
  handleHyperliquidReferral: (
    tabId: number,
    triggerType: HyperliquidPermissionTriggerType,
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

      // After the request is processed, check if it was a successful permission grant for Hyperliquid
      const isHyperliquidConnectionRequest =
        req.method === 'wallet_requestPermissions' &&
        req.origin === HYPERLIQUID_ORIGIN;
      const arePermissionsGranted =
        Array.isArray(res.result) &&
        res.result.some(
          (permission) => permission?.parentCapability === 'eth_accounts',
        );

      if (isHyperliquidConnectionRequest && arePermissionsGranted) {
        handleHyperliquidReferral(
          req.tabId,
          HyperliquidPermissionTriggerType.NewConnection,
        ).catch((error) => {
          log.error(
            'Failed to handle Hyperliquid referral after wallet_requestPermissions grant: ',
            error,
          );
        });
      }
    },
  );
}
