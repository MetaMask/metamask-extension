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

export const HYPERLIQUID_ORIGIN = 'https://app.hyperliquid.xyz';

export type ExtendedJSONRPCRequest = JsonRpcRequest & {
  origin: string;
  tabId: number;
};

export enum HyperliquidPermissionTriggerType {
  NewConnection = 'new_connection',
  OnNavigateConnectedTab = 'on_navigate_connected_tab',
}

/**
 * Creates middleware that monitors permission requests for Hyperliquid.
 * When a permission is granted to Hyperliquid, it triggers the referral flow.
 *
 * @param handleHyperliquidReferral - Function to handle the referral flow
 * @returns Middleware function
 */
export function createHyperliquidReferralMiddleware(
  handleHyperliquidReferral: (args: {
    origin: string;
    tabId: number;
    triggerType: HyperliquidPermissionTriggerType;
  }) => void,
) {
  return createAsyncMiddleware(
    async (
      req: JsonRpcRequest,
      res: PendingJsonRpcResponse<
        ValidPermission<string, Caveat<string, Json>>[]
      >,
      next: AsyncJsonRpcEngineNextCallback,
    ) => {
      const extendedReq = req as ExtendedJSONRPCRequest;
      // First, call next to process the request
      await next();

      // After the request is processed, check if it was a successful permission grant for Hyperliquid
      const isHyperliquidConnectionRequest =
        extendedReq.method === 'wallet_requestPermissions' &&
        extendedReq.origin === HYPERLIQUID_ORIGIN;
      const arePermissionsGranted =
        Array.isArray(res.result) &&
        res.result.some(
          (permission) => permission?.parentCapability === 'eth_accounts',
        );

      if (isHyperliquidConnectionRequest && arePermissionsGranted) {
        try {
          handleHyperliquidReferral({
            origin: HYPERLIQUID_ORIGIN,
            tabId: extendedReq.tabId,
            triggerType: HyperliquidPermissionTriggerType.NewConnection,
          });
        } catch (error) {
          log.error(
            'Failed to handle Hyperliquid referral after wallet_requestPermissions grant: ',
            error,
          );
        }
      }
    },
  );
}
