/**
 * Check if the given value is a valid snap ID.
 *
 * NOTE: This function is a duplicate oF a yet to be released version in @metamask/snaps-utils.
 *
 * @param value - The value to check.
 * @returns `true` if the value is a valid snap ID, and `false` otherwise.
 */
export function isSnapId(value: unknown): value is string {
  return (
    (typeof value === 'string' || value instanceof String) &&
    (value.startsWith('local:') || value.startsWith('npm:'))
  );
}

/**
 * Decode a snap ID fron a pathname.
 *
 * @param pathname - The pathname to decode the snap ID from.
 * @returns The decoded snap ID, or `undefined` if the snap ID could not be decoded.
 */
export const decodeSnapIdFromPathname = (pathname: string) => {
  const snapIdURI = pathname?.match(/[^/]+$/u)?.[0];
  const decoded = snapIdURI && decodeURIComponent(snapIdURI);
  console.log(decoded);
  return decoded;
};
