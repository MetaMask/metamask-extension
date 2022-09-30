/**
 * Represents a list of Snaps that are not allowed to be used.
 * Can be blocked by [ID, VERSION] or SHASUM of a source code (or both).
 *
 * Example:
 * {
 *    id: 'npm:@consensys/snap-id',
 *    versionRange: '<0.1.11',
 *    shasum: 'TEIbWsAyQe/8rBNXOHx3bOP9YF61PIPP/YHeokLchJE=',
 * },
 * {
 *    shasum: 'eCYGZiYvZ3/uxkKI3npfl79kTQXS/5iD9ojsBS4A3rI=',
 * },
 */
export const SNAP_BLOCKLIST = [
  {
    id: 'npm:@consensys/starknet-snap',
    versionRange: '<0.1.11',
  },
  {
    // @consensys/starknet-snap v:0.1.10
    shasum: 'A83r5/ZIcKuKwuAnQHHByVFCuofj7jGK5hOStmHY6A0=',
  },
];
