/**
 * Returns whether or not the given object contains no keys
 *
 * @param obj
 * @returns booleans
 */
export function isEmpty(obj: any): boolean {
  return Object.keys(obj).length === 0;
}
