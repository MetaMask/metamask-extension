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
import { SECOND } from '../../../shared/constants/time';
import {
  getPartnerByOrigin,
  ConnectionFlow,
  type DefiReferralPartnerConfig,
} from '../../../shared/constants/defi-referrals';

export type ExtendedJSONRPCRequest = JsonRpcRequest & {
  origin: string;
  tabId: number;
};

/** How long to wait for the second request to succeed */
const WAIT_AFTER_FIRST_REQUEST_MS = SECOND * 10;

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

const isWalletRequestPermissions = (method: string): boolean =>
  method === 'wallet_requestPermissions';

const isEthRequestAccounts = (method: string): boolean =>
  method === 'eth_requestAccounts';

const isEthSignTypedDataV4 = (method: string): boolean =>
  method === 'eth_signTypedData_v4';

const requiresSignature = (flow: ConnectionFlow) =>
  flow === 'permissions_then_signature';

let pendingSignatureMap: Map<string, number> | null = null;

/**
 * Creates a map of "origin:tabId" with timestamps. Callers add entries when
 * permissions are granted for a referral partner with a two-step connection flow.
 * A timer prunes entries older than WAIT_AFTER_FIRST_REQUEST_MS; when the map becomes
 * empty, the interval is cleared and the module-level reference set to null.
 */
function makePendingSignatureMap(): Map<string, number> {
  const map = new Map<string, number>();

  const intervalId = setInterval(() => {
    const cutoff = Date.now() - WAIT_AFTER_FIRST_REQUEST_MS;
    for (const [key, timestamp] of map.entries()) {
      if (timestamp <= cutoff) {
        map.delete(key);
      }
    }
    if (map.size === 0) {
      clearInterval(intervalId);
      map.clear();
      pendingSignatureMap = null;
    }
  }, WAIT_AFTER_FIRST_REQUEST_MS);

  return map;
}

function getPendingSignatureMap(): Map<string, number> {
  pendingSignatureMap ??= makePendingSignatureMap();
  return pendingSignatureMap;
}

/**
 * Middleware that runs after each JSON-RPC request and may trigger the DeFi referral
 * flow when the origin matches a configured partner.
 *
 * Single-step partners (connectionFlow 'permissions') trigger as soon as permissions
 * are granted (wallet_requestPermissions or eth_requestAccounts).
 *
 * Two-step partners (connectionFlow 'permissions_then_signature'): record the grant
 * when permissions succeed; trigger only when a subsequent eth_signTypedData_v4 for the
 * same origin/tab succeeds. Entries expire after WAIT_AFTER_FIRST_REQUEST_MS.
 *
 * @param handleDefiReferral - Function to handle the referral flow for a partner.
 * @returns Async JSON-RPC middleware.
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

      const key = `${req.origin}:${req.tabId}`;

      if (
        isWalletRequestPermissions(req.method) ||
        isEthRequestAccounts(req.method)
      ) {
        let arePermissionsGranted = false;
        if (Array.isArray(res.result) && res.result.length > 0) {
          if (isWalletRequestPermissions(req.method)) {
            // wallet_requestPermissions returns permission objects with parentCapability key
            const permissions = res.result as { parentCapability?: string }[];
            arePermissionsGranted = permissions.some(
              (permission) => permission?.parentCapability === 'eth_accounts',
            );
          } else {
            // eth_requestAccounts returns an array of address strings
            arePermissionsGranted = res.result.every(
              (address) => typeof address === 'string',
            );
          }
        }

        if (arePermissionsGranted) {
          if (requiresSignature(partner.connectionFlow)) {
            getPendingSignatureMap().set(key, Date.now());
          } else {
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
        }
        return;
      }

      if (
        requiresSignature(partner.connectionFlow) &&
        isEthSignTypedDataV4(req.method) &&
        typeof res.result === 'string'
      ) {
        if (pendingSignatureMap?.has(key)) {
          pendingSignatureMap.delete(key);
          handleDefiReferral(
            partner,
            req.tabId,
            ReferralTriggerType.NewConnection,
          ).catch((error) => {
            log.error(
              `Failed to handle ${partner.name} referral after signature grant: `,
              error,
            );
          });
        }
      }
    },
  );
}
