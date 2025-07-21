// Request and responses are currently untyped.

/**
 * Returns a middleware that appends the mainFrameOrigin to request
 *
 * @param {{ mainFrameOrigin: string }} opts - The middleware options
 * @returns {Function}
 */

export default function createMainFrameOriginMiddleware({
  mainFrameOrigin,
}: {
  mainFrameOrigin: string;
}) {
  return function mainFrameOriginMiddleware(
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    req: any,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _res: any,
    next: () => void,
  ) {
    req.mainFrameOrigin = mainFrameOrigin;
    next();
  };
}
