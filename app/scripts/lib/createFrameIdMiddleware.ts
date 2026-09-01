import { Json, JsonRpcRequest, PendingJsonRpcResponse } from '@metamask/utils';

/**
 * Returns a middleware that appends the sender's frameId to each request.
 * frameId 0 means the top-level frame; any value >0 indicates an iframe.
 *
 * @param opts - The middleware options.
 * @param opts.frameId - The frame ID from chrome.runtime.MessageSender.
 * @returns The middleware function.
 */
export default function createFrameIdMiddleware({
  frameId,
}: {
  frameId: number;
}) {
  return function frameIdMiddleware(
    req: JsonRpcRequest & { frameId: number },
    _res: PendingJsonRpcResponse<Json>,
    next: () => void,
  ) {
    req.frameId = frameId;
    next();
  };
}
