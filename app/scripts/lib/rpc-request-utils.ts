import type { JsonRpcRequest } from '@metamask/utils';

/** JSON-RPC request with origin metadata (added for dapp requests). */
export type OriginAwareJsonRpcRequest = JsonRpcRequest & {
  origin: string;
};

/** JSON-RPC request with origin and tabId metadata (added for dapp requests). */
export type TabAwareJsonRpcRequest = OriginAwareJsonRpcRequest & {
  tabId: number;
};

/**
 * Type guard for requests with origin metadata.
 *
 * @param req - The JSON-RPC request to check.
 */
export function isOriginAwareJsonRpcRequest(
  req: JsonRpcRequest,
): req is OriginAwareJsonRpcRequest {
  return typeof (req as Partial<OriginAwareJsonRpcRequest>).origin === 'string';
}

/**
 * Type guard for requests with origin and tabId metadata.
 *
 * @param req - The JSON-RPC request to check.
 */
export function isTabAwareJsonRpcRequest(
  req: JsonRpcRequest,
): req is TabAwareJsonRpcRequest {
  return (
    typeof (req as Partial<TabAwareJsonRpcRequest>).origin === 'string' &&
    typeof (req as Partial<TabAwareJsonRpcRequest>).tabId === 'number'
  );
}
