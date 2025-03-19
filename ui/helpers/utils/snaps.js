/**
 * Check if the given value is a valid snap ID.
 *
 * NOTE: This function is a duplicate oF a yet to be released version in @metamask/snaps-utils.
 *
 * @param value - The value to check.
 * @returns `true` if the value is a valid snap ID, and `false` otherwise.
 */
export function isSnapId(value) {
  return (
    (typeof value === 'string' || value instanceof String) &&
    (value.startsWith('local:') || value.startsWith('npm:'))
  );
}
