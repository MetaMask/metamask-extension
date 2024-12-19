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
    req: any,
    _res: any,
    next: () => void,
  ) {
    req.mainFrameOrigin = mainFrameOrigin;
    next();
  };
}
