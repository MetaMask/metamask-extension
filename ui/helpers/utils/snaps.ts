import { WALLET_SNAP_PERMISSION_KEY } from '@metamask/snaps-rpc-methods';
import { stripSnapPrefix, SnapsPermissionRequest } from '@metamask/snaps-utils';
import { isObject } from '@metamask/utils';
import { KeyringTypes } from '@metamask/keyring-controller';
import { SnapId } from '@metamask/snaps-sdk';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { isProduction } from '../../../shared/modules/environment';
import { isMultichainWalletSnap } from '../../../shared/lib/accounts';
import { SNAPS_VIEW_ROUTE } from '../constants/routes';
import { MinPermissionAbstractionDisplayCount } from '../../../shared/constants/permissions';

/**
 * Decode a snap ID fron a pathname.
 *
 * @param pathname - The pathname to decode the snap ID from.
 * @returns The decoded snap ID, or `undefined` if the snap ID could not be decoded.
 */
export const decodeSnapIdFromPathname = (pathname: string) => {
  const snapIdURI = pathname?.match(/[^/]+$/u)?.[0];
  return snapIdURI && decodeURIComponent(snapIdURI);
};

const IGNORED_EXAMPLE_SNAPS = ['npm:@metamask/preinstalled-example-snap'];

/**
 * Check if the given snap ID is ignored in production.
 *
 * @param snapId - The snap ID to check.
 * @returns `true` if the snap ID is ignored in production, and `false` otherwise.
 */
export const isSnapIgnoredInProd = (snapId: string) => {
  return isProduction() ? IGNORED_EXAMPLE_SNAPS.includes(snapId) : false;
};

/**
 * Gets a function to return a snap name from its id
 *
 * @param snapsMetadata - Object mapping snap ids to metadata
 * @returns Function to get a snap name from its id
 */
export const getSnapName = (
  snapsMetadata: Record<string, { name?: string }>,
) => {
  return (snapId: string): string => {
    return snapsMetadata[snapId]?.name ?? stripSnapPrefix(snapId);
  };
};

/**
 * Gets the route for a snap
 *
 * @param snapId - Snap id
 * @returns Route string
 */
export const getSnapRoute = (snapId: string): string => {
  return `${SNAPS_VIEW_ROUTE}/${encodeURIComponent(snapId)}`;
};

/**
 * Gets a deduplicated list of snaps from a request
 *
 * @param request - Request object containing permissions
 * @param request.permissions
 * @param permissions - Permissions object
 * @returns Array of snap ids
 */
export const getDedupedSnaps = (
  request?: {
    permissions?: SnapsPermissionRequest;
  },
  permissions?: SnapsPermissionRequest,
): string[] => {
  const permission = request?.permissions?.[WALLET_SNAP_PERMISSION_KEY];
  const requestedSnaps = permission?.caveats[0]?.value;
  const currentSnaps =
    permissions?.[WALLET_SNAP_PERMISSION_KEY]?.caveats[0]?.value;

  if (!isObject(currentSnaps) && requestedSnaps) {
    return Object.keys(requestedSnaps);
  }

  const requestedSnapKeys = requestedSnaps ? Object.keys(requestedSnaps) : [];
  const currentSnapKeys = currentSnaps ? Object.keys(currentSnaps) : [];
  const dedupedSnaps = requestedSnapKeys.filter(
    (snapId) => !currentSnapKeys.includes(snapId),
  );

  return dedupedSnaps.length > 0 ? dedupedSnaps : requestedSnapKeys;
};

/**
 * Check if MetaMask is running in Flask mode
 */
export const IS_FLASK = process.env.METAMASK_BUILD_TYPE === 'flask';

/**
 * Checks if the given keyring type is able to export an account
 *
 * @param keyringType - The type of the keyring
 * @returns `false` if the keyring type includes 'Hardware' or 'Snap', `true` otherwise
 */
export const isAbleToExportAccount = (keyringType = ''): boolean => {
  return !keyringType.includes('Hardware') && !keyringType.includes('Snap');
};

/**
 * Checks if an account can reveal its SRP (Secret Recovery Phrase)
 *
 * @param accountToExport - Account to check
 * @param keyrings - Array of keyrings
 * @returns Whether the account can reveal its SRP
 */
export const isAbleToRevealSrp = (
  accountToExport: InternalAccount,
  keyrings: { type: string; metadata: { id: string } }[],
): boolean => {
  const {
    metadata: {
      keyring: { type },
      snap,
    },
    options: { entropySource },
  } = accountToExport;

  // All hd keyrings can reveal their srp.
  if (type === KeyringTypes.hd) {
    return true;
  }

  // We only consider 1st-party Snaps that have an entropy source.
  if (
    type === KeyringTypes.snap &&
    snap?.id !== undefined &&
    isMultichainWalletSnap(snap.id as SnapId) &&
    entropySource
  ) {
    const keyringId = entropySource;
    return keyrings.some(
      (keyring) =>
        keyring.type === KeyringTypes.hd && keyring.metadata.id === keyringId,
    );
  }

  return false;
};

/**
 * Get abstracted Snap permissions filtered by weight
 *
 * @param weightedPermissions - Set of Snap permissions that have 'weight' property assigned
 * @param weightThreshold - Number that represents weight threshold for filtering
 * @param minPermissionCount - Minimum number of permissions to show
 * @returns Subset of permissions passing weight criteria
 */
export const getFilteredSnapPermissions = (
  weightedPermissions: { weight: number }[],
  weightThreshold = Infinity,
  minPermissionCount = MinPermissionAbstractionDisplayCount,
): { weight: number }[] => {
  const filteredPermissions = weightedPermissions.filter(
    (permission) => permission.weight <= weightThreshold,
  );

  // If there are not enough permissions that fall into desired set filtered by weight,
  // then fill the gap, no matter what the weight is
  if (minPermissionCount && filteredPermissions.length < minPermissionCount) {
    const remainingPermissions = weightedPermissions.filter(
      (permission) => permission.weight > weightThreshold,
    );
    // Add permissions until desired count is reached
    return filteredPermissions.concat(
      remainingPermissions.slice(
        0,
        minPermissionCount - filteredPermissions.length,
      ),
    );
  }

  return filteredPermissions;
};
