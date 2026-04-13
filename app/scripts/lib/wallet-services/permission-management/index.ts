/**
 * permission-management
 *
 * Approval resolution, permission revocation, caveat updates, and network
 * enablement. All controller access via messenger — no chrome.* / browser.* imports.
 *
 * Mobile convergence: acceptPendingApproval and rejectPendingApproval are
 * duplicated verbatim in mobile Engine.ts (L1206, L1181) with the same
 * ApprovalController call pattern.
 */

/**
 * Subset of the Messenger interface required by permission-management.
 * Structural — satisfied by extension RootMessenger, mobile EngineMessenger,
 * or any test double providing these call overloads.
 *
 * Promotion path: replace with RestrictedMessenger from @metamask/base-controller
 * when extracting to a published package.
 */
type PermissionManagementMessenger = {
  call(
    action: 'PermissionController:revokePermissions',
    subjects: Record<string, string[]>,
  ): void;
  call(
    action: 'ApprovalController:accept',
    id: string,
    value: unknown,
    options?: { waitForResult?: boolean },
  ): Promise<void>;
  call(
    action: 'ApprovalController:reject',
    id: string,
    error: { code: number; message: string; data?: unknown },
  ): void;
  call(
    action: 'PermissionController:updateCaveat',
    origin: string,
    target: string,
    caveatType: string,
    caveatValue: unknown,
  ): void;
  call(
    action: 'PermissionController:updatePermissionsByCaveat',
    caveatType: string,
    mutator: (existingScopes: unknown) => unknown,
  ): void;
  call(
    action: 'Caip25CaveatMutators:removeScope',
    existingScopes: unknown,
    scopeString: string,
  ): unknown;
  call(
    action: 'PermissionController:removeAllAccountPermissions',
    targetAccount: string,
  ): void;
  call(
    action: 'ApprovalController:addAndShowApprovalRequest',
    request: {
      id: string;
      origin: string;
      requestData: {
        metadata: { id: string; origin: string };
        permissions: Record<string, unknown>;
        [key: string]: unknown;
      };
      type: string;
    },
  ): Promise<unknown>;
  call(
    action: 'PermissionController:requestPermissionsIncremental',
    subject: { origin: string },
    chainId: string,
  ): Promise<void>;
  call(
    action: 'NetworkOrderController:updateNetworksList',
    chainIds: string[],
  ): void;
  call(
    action: 'NetworkEnablementController:enableNetwork',
    chainId: string,
  ): void;
  call(action: 'NetworkController:lookupNetwork'): Promise<void>;
  registerActionHandler(
    name: string,
    handler: (...args: unknown[]) => unknown,
  ): void;
};

export type PermissionManagementDependencies = {
  messenger: PermissionManagementMessenger;
};

/**
 * Revokes all permissions for the given subjects.
 * Silently ignores missing permissions (PermissionsRequestNotFoundError).
 *
 * Extracted from MetamaskController.removePermissionsFor (line 8582).
 *
 * TODO: Requires messenger action: PermissionController:revokePermissions
 */
export function removePermissionsFor(
  deps: PermissionManagementDependencies,
  subjects: Record<string, string[]>,
): void {
  deps.messenger.call('PermissionController:revokePermissions', subjects);
}

/**
 * Accepts (resolves) a pending approval request.
 *
 * Extracted from MetamaskController.resolvePendingApproval (line 8701).
 * Same pattern as mobile Engine.ts L1206.
 *
 * TODO: Requires messenger action: ApprovalController:accept
 */
export async function resolvePendingApproval(
  deps: PermissionManagementDependencies,
  id: string,
  value: unknown,
  options?: { waitForResult?: boolean },
): Promise<void> {
  const approvalOptions =
    typeof options?.waitForResult === 'boolean'
      ? { waitForResult: options.waitForResult }
      : undefined;

  await deps.messenger.call(
    'ApprovalController:accept',
    id,
    value,
    approvalOptions,
  );
}

/**
 * Rejects a pending approval request with a JSON-RPC error.
 * Silently ignores if the approval was already handled.
 *
 * Extracted from MetamaskController.rejectPendingApproval (line 8726).
 * Same pattern as mobile Engine.ts L1181.
 *
 * TODO: Requires messenger action: ApprovalController:reject
 */
export function rejectPendingApproval(
  deps: PermissionManagementDependencies,
  id: string,
  error: { code: number; message: string; data?: unknown },
): void {
  deps.messenger.call('ApprovalController:reject', id, error);
}

/**
 * Updates a specific caveat value on an existing permission.
 * Silently ignores PermissionsRequestNotFoundError.
 *
 * Extracted from MetamaskController.updateCaveat (L8056).
 *
 * TODO: Requires messenger action: PermissionController:updateCaveat
 */
export function updateCaveat(
  deps: PermissionManagementDependencies,
  origin: string,
  target: string,
  caveatType: string,
  caveatValue: unknown,
): void {
  deps.messenger.call(
    'PermissionController:updateCaveat',
    origin,
    target,
    caveatType,
    caveatValue,
  );
}

/**
 * Removes a scope from all origins' CAIP-25 caveats.
 * Used when a network is removed to clean up dangling scope permissions.
 *
 * Extracted from MetamaskController.removeAllScopePermissions (L5652).
 *
 * TODO: Requires messenger action: PermissionController:updatePermissionsByCaveat
 */
export function removeAllScopePermissions(
  deps: PermissionManagementDependencies,
  scopeString: string,
): void {
  deps.messenger.call(
    'PermissionController:updatePermissionsByCaveat',
    'caip25',
    (existingScopes: unknown) =>
      deps.messenger.call(
        'Caip25CaveatMutators:removeScope',
        existingScopes,
        scopeString,
      ),
  );
}

/**
 * Removes a specific account address from all origins' CAIP-25 caveats.
 * If removing the address leaves a permission with no accounts, that permission
 * is revoked entirely.
 *
 * Extracted from MetamaskController.removeAllAccountPermissions (L5673).
 * Called by account-management.removeAccount before removing a keyring entry.
 *
 * TODO: Requires messenger action: PermissionController:removeAllAccountPermissions
 */
export function removeAllAccountPermissions(
  deps: PermissionManagementDependencies,
  targetAccount: string,
): void {
  deps.messenger.call(
    'PermissionController:removeAllAccountPermissions',
    targetAccount,
  );
}

/**
 * Launches an approval request for the given origin to be granted permissions.
 * Returns the approval result when the user accepts or rejects.
 *
 * Extracted from MetamaskController.requestPermissionApproval (L5789).
 *
 * TODO: Requires messenger action: ApprovalController:addAndShowApprovalRequest
 */
export async function requestPermissionApproval(
  deps: PermissionManagementDependencies,
  origin: string,
  permissions: Record<string, unknown>,
  options: Record<string, unknown> = {},
): Promise<unknown> {
  return deps.messenger.call('ApprovalController:addAndShowApprovalRequest', {
    id: crypto.randomUUID(),
    origin,
    requestData: {
      metadata: { id: crypto.randomUUID(), origin },
      permissions,
      ...options,
    },
    type: 'wallet_requestPermissions',
  });
}

/**
 * Requests incremental chain permissions for an origin (permittedChains pattern).
 * Adds a single chainId to the CAIP-25 caveat via ApprovalController flow.
 *
 * Extracted from MetamaskController.requestApprovalPermittedChainsPermission (L5812).
 *
 * TODO: Requires messenger action: PermissionController:requestPermissionsIncremental
 */
export async function requestApprovalPermittedChainsPermission(
  deps: PermissionManagementDependencies,
  origin: string,
  chainId: string,
): Promise<void> {
  await deps.messenger.call(
    'PermissionController:requestPermissionsIncremental',
    { origin },
    chainId,
  );
}

/**
 * Reorders the user's network list.
 * Persisted in NetworkOrderController state.
 *
 * Extracted from MetamaskController.updateNetworksList (L8072).
 *
 * TODO: Requires messenger action: NetworkOrderController:updateNetworksList
 */
export function updateNetworksList(
  deps: PermissionManagementDependencies,
  chainIds: string[],
): void {
  deps.messenger.call('NetworkOrderController:updateNetworksList', chainIds);
}

/**
 * Enables a network for use.
 * Persisted in NetworkEnablementController state, followed by chain lookup.
 *
 * Extracted from MetamaskController.setEnabledNetworks (L8097).
 *
 * TODO: Requires messenger actions:
 *   - NetworkEnablementController:enableNetwork
 *   - NetworkController:lookupNetwork (for selected network refresh)
 */
export async function setEnabledNetworks(
  deps: PermissionManagementDependencies,
  chainId: string,
): Promise<void> {
  deps.messenger.call('NetworkEnablementController:enableNetwork', chainId);
  await deps.messenger.call('NetworkController:lookupNetwork');
}

// ---------------------------------------------------------------------------
// Action registration
// ---------------------------------------------------------------------------

/** Typed action name constants for permission-management messenger actions. */
export const PERMISSION_MANAGEMENT_ACTIONS = {
  removePermissionsFor: 'PermissionManagement:removePermissionsFor',
  resolvePendingApproval: 'PermissionManagement:resolvePendingApproval',
  rejectPendingApproval: 'PermissionManagement:rejectPendingApproval',
  updateCaveat: 'PermissionManagement:updateCaveat',
  removeAllScopePermissions: 'PermissionManagement:removeAllScopePermissions',
  removeAllAccountPermissions:
    'PermissionManagement:removeAllAccountPermissions',
  requestPermissionApproval: 'PermissionManagement:requestPermissionApproval',
  requestApprovalPermittedChainsPermission:
    'PermissionManagement:requestApprovalPermittedChainsPermission',
  updateNetworksList: 'PermissionManagement:updateNetworksList',
  setEnabledNetworks: 'PermissionManagement:setEnabledNetworks',
} as const;

/**
 * Registers all permission-management functions as Messenger action handlers.
 * Call this once at startup (from background.js or modular init).
 * After registration, callers invoke actions directly — MetamaskController
 * is not in the call chain.
 */
export function registerActions(
  messenger: PermissionManagementMessenger,
): void {
  const deps: PermissionManagementDependencies = { messenger };
  messenger.registerActionHandler(
    PERMISSION_MANAGEMENT_ACTIONS.removePermissionsFor,
    (subjects: Record<string, string[]>) =>
      removePermissionsFor(deps, subjects),
  );
  messenger.registerActionHandler(
    PERMISSION_MANAGEMENT_ACTIONS.resolvePendingApproval,
    (id: string, value: unknown, options?: { waitForResult?: boolean }) =>
      resolvePendingApproval(deps, id, value, options),
  );
  messenger.registerActionHandler(
    PERMISSION_MANAGEMENT_ACTIONS.rejectPendingApproval,
    (id: string, error: { code: number; message: string; data?: unknown }) =>
      rejectPendingApproval(deps, id, error),
  );
  messenger.registerActionHandler(
    PERMISSION_MANAGEMENT_ACTIONS.updateCaveat,
    (
      origin: string,
      target: string,
      caveatType: string,
      caveatValue: unknown,
    ) => updateCaveat(deps, origin, target, caveatType, caveatValue),
  );
  messenger.registerActionHandler(
    PERMISSION_MANAGEMENT_ACTIONS.removeAllScopePermissions,
    (scopeString: string) => removeAllScopePermissions(deps, scopeString),
  );
  messenger.registerActionHandler(
    PERMISSION_MANAGEMENT_ACTIONS.removeAllAccountPermissions,
    (targetAccount: string) => removeAllAccountPermissions(deps, targetAccount),
  );
  messenger.registerActionHandler(
    PERMISSION_MANAGEMENT_ACTIONS.requestPermissionApproval,
    (
      origin: string,
      permissions: Record<string, unknown>,
      options?: Record<string, unknown>,
    ) => requestPermissionApproval(deps, origin, permissions, options),
  );
  messenger.registerActionHandler(
    PERMISSION_MANAGEMENT_ACTIONS.requestApprovalPermittedChainsPermission,
    (origin: string, chainId: string) =>
      requestApprovalPermittedChainsPermission(deps, origin, chainId),
  );
  messenger.registerActionHandler(
    PERMISSION_MANAGEMENT_ACTIONS.updateNetworksList,
    (chainIds: string[]) => updateNetworksList(deps, chainIds),
  );
  messenger.registerActionHandler(
    PERMISSION_MANAGEMENT_ACTIONS.setEnabledNetworks,
    (chainId: string) => setEnabledNetworks(deps, chainId),
  );
}
