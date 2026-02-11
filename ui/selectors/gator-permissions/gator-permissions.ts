import { createSelector } from 'reselect';
import {
  SupportedPermissionType,
  GatorPermissionsControllerState,
  PermissionInfoWithMetadata,
} from '@metamask/gator-permissions-controller';
import { Hex } from '@metamask/utils';
import { isSnapId } from '@metamask/snaps-utils';
import { SubjectType } from '@metamask/permission-controller';
import { isEqualCaseInsensitive } from '../../../shared/modules/string-utils';
import { safeDecodeURIComponent } from '../../components/multichain/pages/gator-permissions/helper';
import {
  getConnectedSitesListWithNetworkInfo,
  getTargetSubjectMetadata,
} from '../selectors';
import { getURLHostName } from '../../helpers/utils/util';

// =============================================================================
// TYPES
// =============================================================================

export type AppState = {
  metamask: GatorPermissionsControllerState;
};

/** A group of permission types (e.g. token-transfer = stream + periodic + revocation). */
export type PermissionTypeGroup = readonly SupportedPermissionType[];

/** Return type for count-by-chain selectors: list of { chainId, count }. */
export type GatorPermissionCountByChain = { chainId: Hex; count: number }[];

/** Summary for one origin + group: total count and chain ids. */
export type GatorPermissionSummary = { count: number; chains: Hex[] };

type ConnectionInfo = {
  addresses: string[];
  addressToNameMap?: Record<string, string>;
  origin: string;
  name: string;
  iconUrl: string | null;
  subjectType: SubjectType;
  networkIconUrl: string;
  networkName: string;
  extensionId: string | null;
  svgIcon?: string;
  version?: string;
  advancedPermissionsCount?: number;
};

// =============================================================================
// CONSTANTS
// =============================================================================

/** Permission types included in the "token-transfer" group. */
export const TOKEN_TRANSFER_GROUP: PermissionTypeGroup = [
  'native-token-stream',
  'erc20-token-stream',
  'native-token-periodic',
  'erc20-token-periodic',
  'erc20-token-revocation',
];

// =============================================================================
// INTERNAL HELPERS – standalone filters (compose with explicit intermediate names)
// =============================================================================

const getMetamaskState = (state: AppState) => state.metamask;

const getGrantedPermissions = createSelector(
  [getMetamaskState],
  (metamask) => metamask.grantedPermissions,
);

/**
 * Permissions filtered by group (shared input for group-scoped selectors).
 *
 * @param _state
 * @param group
 */
const getPermissionsForGroup = createSelector(
  [
    getGrantedPermissions,
    (_state: AppState, group: PermissionTypeGroup) => group,
  ],
  (permissions, group) =>
    permissions.filter(
      ({
        permissionResponse: {
          permission: { type: permissionType },
        },
      }) => group.includes(permissionType as SupportedPermissionType),
    ),
);

/**
 * Filter permissions by site origin (decoded, case-insensitive).
 *
 * @param permissions
 * @param origin
 */
function filterPermissionsByOrigin(
  permissions: PermissionInfoWithMetadata[],
  origin: string,
): PermissionInfoWithMetadata[] {
  const decodedOrigin = safeDecodeURIComponent(origin);

  return permissions.filter(({ siteOrigin }) =>
    isEqualCaseInsensitive(safeDecodeURIComponent(siteOrigin), decodedOrigin),
  );
}

function filterPermissionsByChain(
  permissions: PermissionInfoWithMetadata[],
  chainId: Hex,
): PermissionInfoWithMetadata[] {
  return permissions.filter(
    ({ permissionResponse: { chainId: permissionChainId } }) =>
      permissionChainId === chainId,
  );
}

function sortByStartTime(permissions: PermissionInfoWithMetadata[]) {
  return [...permissions].sort((a, b) => {
    const aStart = a.permissionResponse.permission.data?.startTime as
      | number
      | undefined;
    const bStart = b.permissionResponse.permission.data?.startTime as
      | number
      | undefined;
    if (aStart == null && bStart == null) {
      return 0;
    }
    if (aStart == null) {
      return -1;
    }
    if (bStart == null) {
      return 1;
    }
    return aStart - bStart;
  });
}

function countByChain(
  permissions: PermissionInfoWithMetadata[],
): GatorPermissionCountByChain {
  const counts: Record<Hex, number> = {};

  for (const p of permissions) {
    const { chainId } = p.permissionResponse;
    counts[chainId] = (counts[chainId] ?? 0) + 1;
  }

  return Object.entries(counts).map(([chainId, count]) => ({
    chainId: chainId as Hex,
    count,
  }));
}

const getUniqueSiteOriginsForGroup = createSelector(
  [getPermissionsForGroup],
  (permissionsForGroup): string[] => {
    const origins = new Set<string>();
    for (const { siteOrigin } of permissionsForGroup) {
      if (siteOrigin) {
        origins.add(siteOrigin);
      }
    }
    return [...origins];
  },
);

// =============================================================================
// SELECTORS
// =============================================================================
//
// Reselect passes the same arguments to every input selector when the result
// selector is called. So for getGatorPermissionCountByChain(state, group, origin),
// both inputs receive (state, group, origin). getPermissionsForGroup expects
// (state, group), so we use inline input selectors below to pluck the right
// arguments (e.g. pass (state, group) to getPermissionsForGroup, and pass
// through origin). This keeps each selector's public signature ergonomic for
// call sites (e.g. origin-first where that's the primary filter) instead of
// forcing a single canonical arg list.
//
// =============================================================================

/**
 * Total number of permissions in the given group (all chains).
 */
export const getGatorPermissionCount = createSelector(
  [getPermissionsForGroup],
  (permissionsForGroup) => permissionsForGroup.length,
);

/**
 * Count per chain for the given group; optionally filtered by origin.
 * Return shape is "by chain" (array of { chainId, count }).
 */
export const getGatorPermissionCountByChain = createSelector(
  [
    getPermissionsForGroup,
    // Pluck origin (3rd arg); getPermissionsForGroup already receives (state, group).
    (_state: AppState, _group: PermissionTypeGroup, origin?: string) => origin,
  ],
  (permissionsForGroup, origin): GatorPermissionCountByChain => {
    const filteredPermissions = origin
      ? filterPermissionsByOrigin(permissionsForGroup, origin)
      : permissionsForGroup;

    return countByChain(filteredPermissions);
  },
);

/**
 * Permissions for a specific chain (and optional origin), sorted by startTime.
 * Parameter is "for chain" (filter by chainId).
 */
export const getGatorPermissionsForChain = createSelector(
  [
    // Pass (state, group) to getPermissionsForGroup; args here are (state, chainId, group, origin?).
    (state: AppState, _chainId: Hex, group: PermissionTypeGroup) =>
      getPermissionsForGroup(state, group),
    // Pluck [chainId, origin] for the combiner.
    (
      _state: AppState,
      chainId: Hex,
      _group: PermissionTypeGroup,
      origin?: string,
    ) => [chainId, origin] as const,
  ],
  (permissionsForGroup, [chainId, origin]): PermissionInfoWithMetadata[] => {
    const permissionsForChain = filterPermissionsByChain(
      permissionsForGroup,
      chainId,
    );

    const filteredPermissions = origin
      ? filterPermissionsByOrigin(permissionsForChain, origin)
      : permissionsForChain;

    return sortByStartTime(filteredPermissions);
  },
);

/**
 * All permissions for the given origin and group (all chains), sorted by startTime.
 */
export const getGatorPermissionsByOrigin = createSelector(
  [
    // Pass (state, group) to getPermissionsForGroup; args here are (state, origin, group).
    (state: AppState, _origin: string, group: PermissionTypeGroup) =>
      getPermissionsForGroup(state, group),
    // Pluck origin (2nd arg) for the combiner.
    (_state: AppState, origin: string, _group: PermissionTypeGroup) => origin,
  ],
  (permissionsForGroup, origin): PermissionInfoWithMetadata[] => {
    const permissionsForOrigin = filterPermissionsByOrigin(
      permissionsForGroup,
      origin,
    );

    return sortByStartTime(permissionsForOrigin);
  },
);

/**
 * Summary for one origin and group: total count and list of chain ids.
 */
export const getGatorPermissionSummaryByOrigin = createSelector(
  [
    // Pass (state, group) to getPermissionsForGroup; args here are (state, origin, group).
    (state: AppState, _origin: string, group: PermissionTypeGroup) =>
      getPermissionsForGroup(state, group),
    // Pluck origin (2nd arg) for the combiner.
    (_state: AppState, origin: string, _group: PermissionTypeGroup) => origin,
  ],
  (permissionsForGroup, origin): GatorPermissionSummary => {
    const permissionsForOrigin = filterPermissionsByOrigin(
      permissionsForGroup,
      origin,
    );

    const chains = [
      ...new Set(
        permissionsForOrigin.map(
          ({ permissionResponse: { chainId } }) => chainId,
        ),
      ),
    ];

    return { count: permissionsForOrigin.length, chains };
  },
);

/**
 * Total number of unique sites (connections + gator permission origins), excluding snaps.
 *
 * @param state - App state
 * @param group - Permission type group (e.g. TOKEN_TRANSFER_GROUP)
 */
export const getTotalUniqueSitesCount = createSelector(
  [getConnectedSitesListWithNetworkInfo, getUniqueSiteOriginsForGroup],
  (sitesList, gatorOrigins): number => {
    const connected = Object.keys(sitesList).filter(
      (siteOrigin) => !isSnapId(siteOrigin),
    );

    return new Set([...connected, ...gatorOrigins]).size;
  },
);

/**
 * Merged connections list: traditional connections plus sites with only gator permissions,
 * with advancedPermissionsCount set where applicable.
 *
 * @param state - App state
 * @param group - Permission type group (e.g. TOKEN_TRANSFER_GROUP)
 */
export const getMergedConnectionsListWithGatorPermissions = createSelector(
  [
    getConnectedSitesListWithNetworkInfo,
    getPermissionsForGroup,
    (state: AppState) => state,
  ],
  (sitesList, permissionsForGroup, state): Record<string, ConnectionInfo> => {
    const permissionCountByOrigin = new Map<string, number>();
    for (const { siteOrigin } of permissionsForGroup) {
      if (siteOrigin) {
        permissionCountByOrigin.set(
          siteOrigin,
          (permissionCountByOrigin.get(siteOrigin) ?? 0) + 1,
        );
      }
    }

    const merged: Record<string, ConnectionInfo> = { ...sitesList };

    permissionCountByOrigin.forEach((count, origin) => {
      if (merged[origin]) {
        merged[origin] = { ...merged[origin], advancedPermissionsCount: count };
      } else {
        const meta = getTargetSubjectMetadata(state, origin);
        merged[origin] = {
          addresses: [],
          origin,
          name: meta?.name ?? getURLHostName(origin),
          iconUrl: meta?.iconUrl ?? null,
          subjectType: SubjectType.Website,
          networkIconUrl: '',
          networkName: '',
          extensionId: null,
          advancedPermissionsCount: count,
        };
      }
    });
    return merged;
  },
);

/**
 * List of pending revocations (txId + permissionContext).
 */
export const getPendingRevocations = createSelector(
  [getMetamaskState],
  (metamask) => metamask.pendingRevocations,
);
